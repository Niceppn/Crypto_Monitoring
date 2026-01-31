#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import websocket
import json
import sqlite3
import os
import sys
import time
from datetime import datetime

# =========================
# Configuration
# =========================
RECONNECT_DELAY = 5  # seconds

def get_db_path():
    """Get database path relative to script location"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, '..', 'data', 'crypto_monitoring.db')
    return db_path

def get_socket_url(symbol):
    """Generate WebSocket URL for given symbol"""
    return f"wss://stream.binance.com:9443/ws/{symbol}@aggTrade"

# =========================
# Database Helpers
# =========================
def save_to_db(symbol, timestamp, readable_time, price, quantity, side, is_maker):
    """Save trade data to SQLite database"""
    db_path = get_db_path()

    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}", flush=True)
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO crypto_trades (symbol, timestamp_ms, readable_time, price, quantity, side, is_maker)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (symbol, timestamp, readable_time, price, quantity, side, is_maker))

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Database error: {e}", flush=True)
        return False

# =========================
# WebSocket Callbacks
# =========================
class BinanceCollector:
    def __init__(self, symbol):
        self.symbol = symbol.lower()
        self.socket_url = get_socket_url(self.symbol)
        self.ws = None
        self.trade_count = 0

    def on_message(self, ws, message):
        try:
            data = json.loads(message)

            timestamp = data["T"]                 # trade time (ms)
            price = float(data["p"])              # price
            qty = float(data["q"])                # quantity
            is_maker = data["m"]                  # maker flag

            side = "SELL" if is_maker else "BUY"
            readable_time = datetime.fromtimestamp(
                timestamp / 1000
            ).strftime("%Y-%m-%d %H:%M:%S.%f")

            # Save to database
            if save_to_db(self.symbol.upper(), timestamp, readable_time, price, qty, side, int(is_maker)):
                self.trade_count += 1
                if self.trade_count % 10 == 0:  # Print every 10 trades
                    print(f"[{self.symbol.upper()}] Saved {self.trade_count} trades | Latest: {side} Price={price} Qty={qty}", flush=True)

        except Exception as e:
            print(f"Message error: {e}", flush=True)

    def on_error(self, ws, error):
        print(f"WebSocket error: {error}", flush=True)

    def on_close(self, ws, close_status_code, close_msg):
        print(f"WebSocket closed for {self.symbol.upper()}. Status: {close_status_code}", flush=True)

    def on_open(self, ws):
        print(f"✅ Connected to Binance for {self.symbol.upper()}. Collecting data...", flush=True)

    def run(self):
        """Start collecting data"""
        print(f"🚀 Starting collector for {self.symbol.upper()}", flush=True)

        while True:
            try:
                self.ws = websocket.WebSocketApp(
                    self.socket_url,
                    on_open=self.on_open,
                    on_message=self.on_message,
                    on_error=self.on_error,
                    on_close=self.on_close,
                )
                self.ws.run_forever(ping_interval=20, ping_timeout=10)

            except Exception as e:
                print(f"Fatal error: {e}", flush=True)

            print(f"Reconnect in {RECONNECT_DELAY}s...", flush=True)
            time.sleep(RECONNECT_DELAY)

# =========================
# Main
# =========================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 crypto_collector.py <symbol>")
        print("Example: python3 crypto_collector.py btcusdt")
        sys.exit(1)

    symbol = sys.argv[1].lower()

    # Validate database exists
    db_path = get_db_path()
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}", flush=True)
        print("Please run the server first to initialize the database.", flush=True)
        sys.exit(1)

    collector = BinanceCollector(symbol)
    collector.run()
