"""
Load testing script for the API
Tests concurrent requests and response times
"""

import time
import requests
import json
import concurrent.futures
import statistics
from datetime import datetime


class LoadTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.results = {
            "register": [],
            "login": [],
            "analyze": [],
            "dashboard": [],
            "history": []
        }
        self.errors = []

    def register_user(self, username: str, email: str, password: str) -> dict:
        """Register a new user"""
        try:
            response = requests.post(
                f"{self.base_url}/register",
                json={
                    "username": username,
                    "email": email,
                    "password": password
                },
                timeout=10
            )
            return {
                "status": response.status_code,
                "time": response.elapsed.total_seconds() * 1000
            }
        except Exception as e:
            self.errors.append(f"Register error: {str(e)}")
            return {"status": 0, "time": 0}

    def login_user(self, username: str, password: str) -> tuple:
        """Login user and return token"""
        try:
            response = requests.post(
                f"{self.base_url}/login",
                json={
                    "username": username,
                    "password": password
                },
                timeout=10
            )
            if response.status_code == 200:
                token = response.json().get("token")
                return (
                    {
                        "status": response.status_code,
                        "time": response.elapsed.total_seconds() * 1000
                    },
                    token
                )
            return ({"status": response.status_code, "time": 0}, None)
        except Exception as e:
            self.errors.append(f"Login error: {str(e)}")
            return ({"status": 0, "time": 0}, None)

    def analyze_code(self, token: str, code: str) -> dict:
        """Analyze code"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.post(
                f"{self.base_url}/analyze",
                json={"code": code, "language": "python"},
                headers=headers,
                timeout=15
            )
            return {
                "status": response.status_code,
                "time": response.elapsed.total_seconds() * 1000
            }
        except Exception as e:
            self.errors.append(f"Analyze error: {str(e)}")
            return {"status": 0, "time": 0}

    def get_dashboard(self, token: str) -> dict:
        """Get dashboard"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{self.base_url}/dashboard",
                headers=headers,
                timeout=10
            )
            return {
                "status": response.status_code,
                "time": response.elapsed.total_seconds() * 1000
            }
        except Exception as e:
            self.errors.append(f"Dashboard error: {str(e)}")
            return {"status": 0, "time": 0}

    def get_history(self, token: str) -> dict:
        """Get history"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{self.base_url}/history",
                headers=headers,
                timeout=10
            )
            return {
                "status": response.status_code,
                "time": response.elapsed.total_seconds() * 1000
            }
        except Exception as e:
            self.errors.append(f"History error: {str(e)}")
            return {"status": 0, "time": 0}

    def simulate_user_workflow(self, user_id: int) -> None:
        """Simulate a complete user workflow"""
        try:
            # Register
            username = f"loadtest_user_{user_id}"
            email = f"loadtest{user_id}@example.com"
            password = f"LoadTest{user_id}Pass123!"

            reg_result = self.register_user(username, email, password)
            self.results["register"].append(reg_result)

            # Small delay between register and login
            time.sleep(0.1)

            # Login
            login_result, token = self.login_user(username, password)
            self.results["login"].append(login_result)

            if token:
                # Analyze code
                code = f'''
# Test code {user_id}
def calculate(x, y):
    return x + y

class Calculator:
    def add(self, a, b):
        return a + b
'''
                analyze_result = self.analyze_code(token, code)
                self.results["analyze"].append(analyze_result)

                # Get dashboard
                dashboard_result = self.get_dashboard(token)
                self.results["dashboard"].append(dashboard_result)

                # Get history
                history_result = self.get_history(token)
                self.results["history"].append(history_result)
        except Exception as e:
            self.errors.append(f"Workflow error for user {user_id}: {str(e)}")

    def run_concurrent_load(self, num_users: int = 10) -> None:
        """Run load test with concurrent users"""
        print(f"🚀 Starting load test with {num_users} concurrent users...")
        print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_users) as executor:
            futures = [
                executor.submit(self.simulate_user_workflow, i)
                for i in range(num_users)
            ]
            concurrent.futures.wait(futures)

    def print_results(self) -> None:
        """Print test results"""
        print("\n" + "="*80)
        print("🔍 LOAD TEST RESULTS")
        print("="*80)

        for endpoint, times in self.results.items():
            if times:
                valid_times = [t["time"] for t in times if t["time"] > 0]
                if valid_times:
                    successful = sum(1 for t in times if t["status"] == 200 or t["status"] == 201)
                    print(f"\n📊 {endpoint.upper()}")
                    print(f"   Total Requests: {len(times)}")
                    print(f"   Successful: {successful}/{len(times)}")
                    print(f"   Min Response: {min(valid_times):.2f}ms")
                    print(f"   Max Response: {max(valid_times):.2f}ms")
                    print(f"   Avg Response: {statistics.mean(valid_times):.2f}ms")
                    if len(valid_times) > 1:
                        print(f"   Std Dev: {statistics.stdev(valid_times):.2f}ms")
                    print(f"   p95 Response: {sorted(valid_times)[int(len(valid_times)*0.95)]:.2f}ms")

        print(f"\n📈 ERRORS: {len(self.errors)}")
        if self.errors:
            for error in self.errors[:5]:
                print(f"   - {error}")
            if len(self.errors) > 5:
                print(f"   ... and {len(self.errors)-5} more")

        print("\n✅ Load test completed!")
        print("="*80)

    def generate_report(self) -> str:
        """Generate a report of load test results"""
        report = f"""
# Load Test Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary
- Total Endpoints Tested: {len(self.results)}
- Total Requests: {sum(len(times) for times in self.results.values())}
- Errors: {len(self.errors)}

## Results by Endpoint
"""
        for endpoint, times in self.results.items():
            if times:
                valid_times = [t["time"] for t in times if t["time"] > 0]
                successful = sum(1 for t in times if t["status"] in [200, 201])
                if valid_times:
                    report += f"""
### {endpoint.upper()}
- Requests: {len(times)}
- Success Rate: {100*successful/len(times):.1f}%
- Avg Response Time: {statistics.mean(valid_times):.2f}ms
- Min Response Time: {min(valid_times):.2f}ms
- Max Response Time: {max(valid_times):.2f}ms
- p95 Response Time: {sorted(valid_times)[int(len(valid_times)*0.95)]:.2f}ms
"""

        return report


if __name__ == "__main__":
    import sys

    # Get number of users from command line, default to 10
    num_users = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    base_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:5000"

    tester = LoadTester(base_url)
    tester.run_concurrent_load(num_users)
    tester.print_results()

    # Save report
    report = tester.generate_report()
    with open("load_test_report.md", "w") as f:
        f.write(report)
    print(f"\n📄 Report saved to load_test_report.md")
