import random
import time
import math
from typing import Dict, Any

class SyntheticSensorGenerator:
    """
    Generates synthetic heart rate, SpO2, skin temperature, and IMU data.
    The data is physiologically plausible and tied to a simulated exertion level.
    """
    def __init__(self):
        self.base_hr = 60.0
        self.base_spo2 = 98.0
        self.base_temp = 36.5
        
        self.current_hr = self.base_hr
        self.current_spo2 = self.base_spo2
        self.current_temp = self.base_temp
        
        # Internal state for IMU simulation
        self.time_t = 0.0

    def generate(self, exertion_level: float = 0.0) -> Dict[str, Any]:
        """
        Generate a data frame.
        exertion_level: 0.0 (rest) to 1.0 (max exertion)
        """
        self.time_t += 0.1
        
        # Heart rate responds to exertion with lag and noise
        target_hr = self.base_hr + (exertion_level * 100.0)
        self.current_hr += (target_hr - self.current_hr) * 0.1 + random.uniform(-1, 1)
        self.current_hr = max(40.0, min(200.0, self.current_hr))
        
        # SpO2 drops slightly with extreme exertion
        target_spo2 = self.base_spo2 - (exertion_level * 3.0)
        self.current_spo2 += (target_spo2 - self.current_spo2) * 0.05 + random.uniform(-0.2, 0.2)
        self.current_spo2 = max(85.0, min(100.0, self.current_spo2))
        
        # Skin temperature rises slowly
        target_temp = self.base_temp + (exertion_level * 1.5)
        self.current_temp += (target_temp - self.current_temp) * 0.01 + random.uniform(-0.05, 0.05)
        
        # IMU simulation based on exertion
        accel_x = math.sin(self.time_t * 5.0) * exertion_level * 2.0 + random.uniform(-0.1, 0.1)
        accel_y = math.cos(self.time_t * 3.0) * exertion_level * 2.0 + random.uniform(-0.1, 0.1)
        accel_z = 9.81 + math.sin(self.time_t * 4.0) * exertion_level + random.uniform(-0.1, 0.1)

        return {
            "timestamp": int(time.time() * 1000),
            "heart_rate": round(self.current_hr, 1),
            "spo2": round(self.current_spo2, 1),
            "temperature": round(self.current_temp, 2),
            "accel_x": round(accel_x, 3),
            "accel_y": round(accel_y, 3),
            "accel_z": round(accel_z, 3),
            "source": "synthetic",
            "sensor_quality": "High"
        }

if __name__ == "__main__":
    generator = SyntheticSensorGenerator()
    print("Simulating resting...")
    for _ in range(3):
        print(generator.generate(0.1))
        time.sleep(0.1)
    
    print("\nSimulating exertion...")
    for _ in range(5):
        print(generator.generate(0.8))
        time.sleep(0.1)
