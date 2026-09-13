import requests
from typing import List, Dict, Any, Optional
import base64
import hmac
import hashlib


GITHUB_API = "https://api.github.com"


class GitHubClient:
    def __init__(self, token: str, repo_owner: str = None, repo_name: str = None):
        self.token = token
        self.repo_owner = repo_owner
        self.repo_name = repo_name
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "IntelliReview-AI"
        }

    def _url(self, path: str) -> str:
        return f"{GITHUB_API}/repos/{self.repo_owner}/{self.repo_name}{path}"

    def get_current_user(self) -> Dict[str, Any]:
        response = requests.get(f"{GITHUB_API}/user", headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_user_repos(self, per_page: int = 100, page: int = 1) -> List[Dict[str, Any]]:
        params = {"per_page": per_page, "page": page, "sort": "updated", "direction": "desc"}
        response = requests.get(f"{GITHUB_API}/user/repos", headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def get_repo_branches(self, per_page: int = 100) -> List[Dict[str, Any]]:
        response = requests.get(self._url("/branches"), headers=self.headers, params={"per_page": per_page})
        response.raise_for_status()
        return response.json()

    def get_pull_requests(self, state: str = "open", per_page: int = 50) -> List[Dict[str, Any]]:
        response = requests.get(self._url("/pulls"), headers=self.headers, params={"state": state, "per_page": per_page})
        response.raise_for_status()
        return response.json()

    def get_pull_request_files(self, pr_number: int) -> List[Dict[str, Any]]:
        url = self._url(f"/pulls/{pr_number}/files")
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_file_content(self, file_path: str, ref: str = None) -> Optional[str]:
        url = self._url(f"/contents/{file_path}")
        params = {"ref": ref} if ref else {}
        response = requests.get(url, headers=self.headers, params=params)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        data = response.json()
        if data.get("encoding") == "base64":
            return base64.b64decode(data["content"]).decode("utf-8")
        return data.get("content", "")

    def create_pr_comment(self, pr_number: int, body: str) -> Dict[str, Any]:
        url = self._url(f"/issues/{pr_number}/comments")
        response = requests.post(url, headers=self.headers, json={"body": body})
        response.raise_for_status()
        return response.json()

    def get_pr_comments(self, pr_number: int) -> List[Dict[str, Any]]:
        url = self._url(f"/issues/{pr_number}/comments")
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def update_pr_comment(self, comment_id: int, body: str) -> Dict[str, Any]:
        url = self._url(f"/issues/comments/{comment_id}")
        response = requests.patch(url, headers=self.headers, json={"body": body})
        response.raise_for_status()
        return response.json()

    def create_review_comment(self, pr_number: int, commit_sha: str, path: str,
                               body: str, line: int, side: str = "RIGHT") -> Dict[str, Any]:
        url = self._url(f"/pulls/{pr_number}/comments")
        data = {"body": body, "commit_id": commit_sha, "path": path, "line": line, "side": side}
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def get_pr_details(self, pr_number: int) -> Dict[str, Any]:
        response = requests.get(self._url(f"/pulls/{pr_number}"), headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_repo_info(self) -> Dict[str, Any]:
        response = requests.get(self._url(""), headers=self.headers)
        response.raise_for_status()
        return response.json()

    def create_webhook(self, events: List[str], url: str, secret: str) -> Dict[str, Any]:
        data = {"name": "web", "active": True, "events": events, "config": {"url": url, "secret": secret, "content_type": "json"}}
        response = requests.post(self._url("/hooks"), headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def delete_webhook(self, hook_id: int) -> bool:
        response = requests.delete(self._url(f"/hooks/{hook_id}"), headers=self.headers)
        return response.status_code == 204


def create_github_client(token: str, repo_full_name: str = None) -> GitHubClient:
    if repo_full_name:
        owner, name = repo_full_name.split("/", 1)
        return GitHubClient(token, owner, name)
    return GitHubClient(token)
