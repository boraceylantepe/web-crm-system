import time
import threading
import subprocess
import logging
import os
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('deadline_checker.log')
    ]
)

logger = logging.getLogger('deadline_checker')

def run_deadline_check():
    """Run the deadline check management command"""
    try:
        logger.info("Running deadline check...")
        result = subprocess.run(
            ['python', 'manage.py', 'check_upcoming_deadlines'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Django project root
        )
        
        logger.info(f"Command output: {result.stdout}")
        if result.stderr:
            logger.error(f"Command error: {result.stderr}")
            
        logger.info("Deadline check completed")
    except Exception as e:
        logger.error(f"Error running deadline check: {str(e)}")

def start_scheduler():
    """Start the deadline check scheduler"""
    # Run every 30 minutes
    interval_seconds = 30 * 60
    
    logger.info(f"Starting deadline check scheduler (interval: {interval_seconds} seconds)")
    
    while True:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        logger.info(f"Running scheduled check at {current_time}")
        
        try:
            run_deadline_check()
        except Exception as e:
            logger.error(f"Error in scheduler: {str(e)}")
        
        logger.info(f"Next check in {interval_seconds} seconds")
        time.sleep(interval_seconds)

def run_scheduler_in_thread():
    """Run the scheduler in a background thread"""
    scheduler_thread = threading.Thread(target=start_scheduler)
    scheduler_thread.daemon = True  # Thread will exit when main thread exits
    scheduler_thread.start()
    logger.info("Deadline check scheduler thread started")
    return scheduler_thread 