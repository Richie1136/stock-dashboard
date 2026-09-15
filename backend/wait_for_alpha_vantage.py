import time

last_request = None

def wait_for_alpha_vantage():
    global last_request

    if last_request is not None:
        elapsed_time = time.monotonic() - last_request
        remaining_time = 1.1 - elapsed_time

        if remaining_time > 0:
            time.sleep(remaining_time)

    last_request = time.monotonic()