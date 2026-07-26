import requests
from typing import List, Dict, Any, Optional
import base64
import hmac
import hashlib


class GitHubClient:
    def __init__(self, token: str, repo_owner: str, repo_name: str):
        self.token = token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AI-Code-Review-Assistant"
        }

    def get_pull_request_files(self, pr_number: int) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}/files"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_file_content(self, file_path: str, ref: str = None) -> Optional[str]:
        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/contents/{file_path}"
        params = {"ref": ref} if ref else {}
        response = requests.get(url, headers=self.headers, params=params)

        if response.status_code == 404:
            return None

        response.raise_for_status()
        data = response.json()

        if data.get("encoding") == "base64":
            content = base64.b64decode(data["content"]).decode("utf-8")
            return content

        return data.get("content", "")

    def create_pr_comment(self, pr_number: int, body: str) -> Dict[str, Any]:
        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/issues/{pr_number}/comments"
        response = requests.post(url, headers=self.headers, json={"body": body})
        response.raise_for_status()
        return response.json()

    def create_pr_review(self, pr_number: int, body: str, event: str = "COMMENT",
                          comments: List[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}/reviews"
        data = {"body": body, "event": event}
        if comments:
            data["comments"] = comments
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def create_review_comment(self, pr_number: int, commit_sha: str, path: str,
                               body: str, line: int, side: str = "RIGHT") -> Dict[str, Any]:
        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}/comments"
        data = {
            "body": body,
            "commit_id": commit_sha,
            "path": path,
            "line": line,
            "side": side
        }
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def get_pr_details(self, pr_number: int) -> Dict[str, Any]:
        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_repo_info(self) -> Dict[str, Any]:
        url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def verify_webhook_signature(self, payload: bytes, signature: str, secret: str) -> bool:
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(f"sha256={expected}", signature)

    def is_python_file(self, file_path: str) -> bool:
        return file_path.endswith(".py")


def create_github_client(token: str, repo_full_name: str) -> GitHubClient:
    owner, name = repo_full_name.split("/", 1)
    return GitHubClient(token, owner, name)