import time
import threading

last_request = None

alpha_vantage_lock = threading.Lock()

def wait_for_alpha_vantage():
    global last_request

    # Allow only one Flask request at a time to check and update
    # the Alpha Vantage request timer so concurrent API calls
    # do not exceed the per-second rate limit.
    with alpha_vantage_lock:

        if last_request is not None:
            elapsed_time = time.monotonic() - last_request
            remaining_time = 1.1 - elapsed_time

            if remaining_time > 0:
                time.sleep(remaining_time)

        last_request = time.monotonic()