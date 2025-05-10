import psutil
import GPUtil
import time
import os

def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

while True:
    clear_console()

    # CPU
    cpu_percent = psutil.cpu_percent(interval=1)

    # RAM
    ram = psutil.virtual_memory()
    ram_percent = ram.percent

    # GPU (NVIDIA)
    try:
        gpus = GPUtil.getGPUs()
        if gpus:
            gpu = gpus[0]
            gpu_load = gpu.load * 100
            gpu_mem = gpu.memoryUtil * 100
        else:
            gpu_load = gpu_mem = "N/A"
    except Exception as e:
        gpu_load = gpu_mem = "N/A"

    print(f"🔧 CPU Usage     : {cpu_percent}%")
    print(f"🧠 RAM Usage     : {ram_percent}%")
    print(f"🎮 GPU Load      : {gpu_load}%")
    print(f"🎮 GPU Memory    : {gpu_mem}%")

