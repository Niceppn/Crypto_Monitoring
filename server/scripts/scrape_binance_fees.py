import time
import pandas as pd
import sqlite3
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup

def get_db_path():
    """Get database path relative to script location"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, '..', 'data', 'crypto_monitoring.db')
    return db_path

def scrape_binance_fees_headless():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    url = "https://www.binance.com/en/fee/tradingPromote"
    print(f"กำลังเชื่อมต่อ... {url}")
    driver.get(url)

    all_data = []
    page_num = 1
    
    try:
        wait = WebDriverWait(driver, 15)
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "bn-web-table-row")))
        
        while True:
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            rows = soup.find_all('tr', class_='bn-web-table-row')
            
            row_count = 0
            for row in rows:
                cells = row.find_all('td', class_='bn-web-table-cell')
                if not cells: continue
                
                symbol_div = cells[0].get_text(strip=True)
                if "/" not in symbol_div:
                    continue
                
                maker_fee = cells[1].get_text(strip=True)
                taker_fee = cells[2].get_text(strip=True)
                
                all_data.append({
                    'Symbol': symbol_div,
                    'Maker Fee': maker_fee,
                    'Taker Fee': taker_fee
                })
                row_count += 1

            print(f"หน้า {page_num}: เก็บได้ {row_count} คู่เหรียญ (รวมสะสม {len(all_data)})")

            try:
                next_btn = driver.find_element(By.CSS_SELECTOR, ".bn-pagination-next")
                if next_btn.get_attribute("aria-disabled") == "true":
                    break
                
                driver.execute_script("arguments[0].click();", next_btn)
                time.sleep(2) 
                page_num += 1
            except:
                break
    finally:
        driver.quit()

    return pd.DataFrame(all_data)

def save_to_database(df_new, scrape_time):
    """Save scraped data to database instead of CSV"""
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return 0, 0
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get existing symbols from current scrape
        cursor.execute("""
            SELECT DISTINCT symbol FROM promotion_fees 
            WHERE scrape_time = ?
        """, (scrape_time,))
        existing_symbols = {row[0] for row in cursor.fetchall()}
        
        # Get all existing symbols (from all scrapes)
        cursor.execute("SELECT DISTINCT symbol FROM promotion_fees")
        all_existing_symbols = {row[0] for row in cursor.fetchall()}
        
        new_count = 0
        total_count = 0
        
        for _, row in df_new.iterrows():
            symbol = row['Symbol']
            maker_fee = row['Maker Fee']
            taker_fee = row['Taker Fee']
            
            # Check if this symbol already exists in this scrape
            if symbol not in existing_symbols:
                try:
                    cursor.execute("""
                        INSERT INTO promotion_fees (symbol, maker_fee, taker_fee, scrape_time)
                        VALUES (?, ?, ?, ?)
                    """, (symbol, maker_fee, taker_fee, scrape_time))
                    new_count += 1
                except sqlite3.IntegrityError:
                    # Already exists in this scrape, skip
                    pass
            
            # Count if it's new compared to all previous scrapes
            if symbol not in all_existing_symbols:
                total_count += 1
        
        conn.commit()
        return new_count, total_count
        
    except Exception as e:
        print(f"❌ Error saving to database: {e}")
        conn.rollback()
        return 0, 0
    finally:
        conn.close()

if __name__ == "__main__":
    scrape_time = datetime.now().isoformat()
    print("🚀 เริ่มตรวจสอบโปรโมชั่นค่าธรรมเนียม...")
    
    # 1. Scrape ข้อมูลใหม่
    df_new = scrape_binance_fees_headless()
    
    if not df_new.empty:
        print(f"\n📊 เก็บข้อมูลได้ทั้งหมด {len(df_new)} รายการ")
        
        # 2. บันทึกลง database
        new_count, total_new = save_to_database(df_new, scrape_time)
        
        # 3. บันทึกประวัติการ scrape
        db_path = get_db_path()
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO scrape_history (total_records, new_records, scrape_time, status)
                    VALUES (?, ?, ?, ?)
                """, (len(df_new), new_count, scrape_time, 'success'))
                conn.commit()
            except Exception as e:
                print(f"❌ Error saving scrape history: {e}")
            finally:
                conn.close()
        
        if new_count > 0:
            print(f"\n✨ พบ {new_count} รายการใหม่ (เทียบกับ scrape นี้)")
            print(f"📈 พบ {total_new} รายการใหม่ (เทียบกับทั้งหมด)")
            print(f"✅ บันทึกข้อมูลลง database เรียบร้อย")
        else:
            print("\nℹ️ ข้อมูลเป็นปัจจุบันอยู่แล้ว ไม่พบรายการใหม่")
    else:
        print("\n❌ ไม่พบข้อมูลจากการ Scrape")
        # Save failed scrape history
        db_path = get_db_path()
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO scrape_history (total_records, new_records, scrape_time, status)
                    VALUES (?, ?, ?, ?)
                """, (0, 0, scrape_time, 'failed'))
                conn.commit()
            except Exception as e:
                print(f"❌ Error saving scrape history: {e}")
            finally:
                conn.close()

