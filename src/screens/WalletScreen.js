import React, { useState } from "react";
import Navigation from "../components/Navigation";
import "./WalletScreen.css";

/**
 * WalletScreen component for connecting and displaying wallet information.
 * Allows users to connect a wallet or disconnect from an existing one.
 */
const WalletScreen = () => {
  // State to track wallet connection status
  const [isConnected, setIsConnected] = useState(false);
  // Mock wallet address (replace with actual data from backend in production)
  const walletAddress = "UQCkNKQP....3LYgP7-Z";

  /**
   * Handles disconnecting the wallet by resetting the connection state.
   */
  const handleDisconnect = () => {
    setIsConnected(false);
  };

  /**
   * Handles copying the wallet address to the clipboard.
   */
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    alert("Wallet address copied to clipboard!");
  };

  return (
    <div className="wallet-screen">
      <div className="wallet-content">
        {/* Top section with wallet icon and conditional content */}
        <div className="wallet-top-section">
          <img
            src={`${process.env.PUBLIC_URL}/wallet.png`}
            alt="Wallet Icon"
            className="wallet-icon-large"
          />
          {!isConnected ? (
            <>
              {/* Pre-connection state */}
              <h2 className="wallet-title">Wallet</h2>
              <p className="wallet-description">
                Open wallet in Telegram or select your wallet to connect
              </p>
              <img
                src={`${process.env.PUBLIC_URL}/wallet.gif`} // Replace with your GIF file
                alt="Wallet Animation"
                className="wallet-gif"
              />

              Telegram wallet link card
              <div className="wallet-data-card">
                <img
                  src={`${process.env.PUBLIC_URL}/wallet.png`}
                  alt="Wallet Icon"
                  className="data-card-icon"
                />
                <p className="data-card-text">Open Wallet in Telegram</p>
                <img
                  src={`${process.env.PUBLIC_URL}/telegram.png`}
                  alt="Telegram Icon"
                  className="data-card-icon"
                />
              </div>

              {/* Wallet selection options */}
              <div className="wallet-selection">
                {[
                  { name: "Tonkeeper", icon: "tonkeeper.png" },
                  { name: "Binance", icon: "binance.png" },
                  { name: "Bybit", icon: "bybit.png" },
                  { name: "View More", icon: "multiple-icons.png" },
                ].map((wallet) => (
                  <div
                    className="wallet-frame"
                    key={wallet.name}
                    onClick={() => wallet.name !== "View More" && setIsConnected(true)} // Mock connection
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/${wallet.icon}`}
                      alt={`${wallet.name} Icon`}
                      className="wallet-frame-icon"
                    />
                    <p className="wallet-frame-text">{wallet.name}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Post-connection state */}
              <h2 className="wallet-title">Connected Address Verified</h2>
              <div className="wallet-connected-card">
                <img
                  src={`${process.env.PUBLIC_URL}/wallet-small.png`}
                  alt="Wallet Icon"
                  className="connected-card-icon"
                />
                <p className="connected-card-text">{walletAddress}</p>
                <img
                  src={`${process.env.PUBLIC_URL}/copy-icon.png`}
                  alt="Copy Icon"
                  className="connected-card-icon"
                  onClick={handleCopyAddress}
                  style={{ cursor: "pointer" }}
                />
              </div>
              <button className="disconnect-button" onClick={handleDisconnect}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default WalletScreen;