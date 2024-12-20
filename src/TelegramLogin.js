import React, { useEffect } from "react";

const TelegramLogin = () => {
  const handleTelegramAuth = (user) => {
    console.log("Telegram User Data:", user);
    // Example: Save user data to local storage or send it to a backend
    localStorage.setItem("telegramUser", JSON.stringify(user));
    alert(`Welcome, ${user.first_name}!`);
  };

  useEffect(() => {
    // Inject Telegram Login Widget dynamically
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?7";
    script.async = true;
    script.setAttribute("data-telegram-login", "YOUR_BOT_USERNAME"); // Replace with your bot username
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-auth-url", "http://localhost:3000/auth/callback"); // Replace with your callback URL
    script.setAttribute("data-request-access", "write");

    // Append the widget script to the container
    const container = document.getElementById("telegram-login-container");
    if (container) container.appendChild(script);

    // Attach Telegram auth handler to global scope
    window.handleTelegramAuth = handleTelegramAuth;
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to Bored Tap!</h1>
      <p>Telegram OAuth Login Screen</p>
      <div id="telegram-login-container"></div>
    </div>
  );
};

export default TelegramLogin;
