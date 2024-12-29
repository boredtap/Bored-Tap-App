import React, { useState } from "react";
import Navigation from "../components/Navigation";
import "./WalletScreen.css";

const WalletScreen = () => {
  const [isConnected, setIsConnected] = useState(false); // State to toggle connection
  const walletAddress = "UQCkNKQP....3LYgP7-Z";

  const handleDisconnect = () => {
    setIsConnected(false); // Reset wallet connection state
  };

  return (
    <div className="wallet-screen">

      <div className="wallet-content">
        {/* Top Centralized Image */}
        <div className="wallet-top-section">
          <img
            src={`${process.env.PUBLIC_URL}/wallet.png`}
            alt="Wallet Icon"
            className="wallet-icon-large"
          />
          {!isConnected ? (
            <>
              {/* Before Wallet Connect */}
              <h2 className="wallet-title">Connect your wallet</h2>
              <p className="wallet-description">
                Open wallet in Telegram or select your wallet to connect
              </p>

              {/* Data Card */}
              <div className="wallet-data-card">
                <img
                  src={`${process.env.PUBLIC_URL}/wallet.png`}
                  alt="Wallet"
                  className="data-card-icon"
                />
                <p className="data-card-text">Open Wallet in Telegram</p>
                <img
                  src={`${process.env.PUBLIC_URL}/telegram.png`}
                  alt="Telegram"
                  className="data-card-icon"
                />
              </div>

              {/* Wallet Selection Frames */}
              <div className="wallet-selection">
                <div className="wallet-frame">
                  <img
                    src={`${process.env.PUBLIC_URL}/tonkeeper.png`}
                    alt="Tonkeeper"
                    className="wallet-frame-icon"
                  />
                  <p className="wallet-frame-text">Tonkeeper</p>
                </div>
                <div className="wallet-frame">
                  <img
                    src={`${process.env.PUBLIC_URL}/binance.png`}
                    alt="Binance"
                    className="wallet-frame-icon"
                  />
                  <p className="wallet-frame-text">Binance</p>
                </div>
                <div className="wallet-frame">
                  <img
                    src={`${process.env.PUBLIC_URL}/bybit.png`}
                    alt="Bybit"
                    className="wallet-frame-icon"
                  />
                  <p className="wallet-frame-text">Bybit</p>
                </div>
                <div className="wallet-frame">
                  <img
                    src={`${process.env.PUBLIC_URL}/multiple-icons.png`}
                    alt="View More"
                    className="wallet-frame-icon"
                  />
                  <p className="wallet-frame-text">View More</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* After Wallet Connect */}
              <h2 className="wallet-title">Connect address verified:</h2>

              {/* Wallet Data Card */}
              <div className="wallet-connected-card">
                <img
                  src={`${process.env.PUBLIC_URL}/wallet-small.png`}
                  alt="Wallet"
                  className="connected-card-icon"
                />
                <p className="connected-card-text">{walletAddress}</p>
                <img
                  src={`${process.env.PUBLIC_URL}/copy-icon.png`}
                  alt="Copy"
                  className="connected-card-icon"
                />
              </div>

              {/* Disconnect CTA */}
              <button className="disconnect-button" onClick={handleDisconnect}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default WalletScreen;
