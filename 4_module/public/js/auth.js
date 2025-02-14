function showLoginForm() {
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

function showRegisterForm() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
}

async function login() {
  try {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    console.log("Attempting login for:", username);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (response.ok && data.status === "success") {
      window.location.href = "/dashboard.html";
    } else {
      alert(data.message || "ログインに失敗しました");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("ログイン中にエラーが発生しました");
  }
}

async function register() {
  try {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    console.log("Attempting registration for:", username);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log("Registration response:", data);

    if (response.ok && data.status === "success") {
      alert("登録が完了しました。ログインしてください。");
      showLoginForm();
    } else {
      alert(data.message || "登録に失敗しました");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("登録中にエラーが発生しました");
  }
}
