#  scheduler.py

from generate_maps import generate_and_save_maps

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
import atexit

def scheduled_maps():
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=generate_and_save_maps, trigger=CronTrigger(hour=12, minute=42), timezone=pytz.utc)
    scheduler.start()
    print("Scheduler started.")
    atexit.register(lambda: scheduler.shutdown())