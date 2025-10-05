import { useState, useEffect } from 'react';

const Footer = ({ onSecretLineClick }) => {
  // State for click positions (for dots)
  const [clicks, setClicks] = useState([]);
  // State for counting clicks for secret box
  const [clickCount, setClickCount] = useState(0);

  // Handle click on the silver line
  const handleLineClick = (e) => {
    // Add dot for visual feedback
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // Click position relative to the line
    const clickId = Date.now();
    setClicks((prev) => [...prev, { id: clickId, x }]);
    // Remove dot after 1 second
    setTimeout(() => {
      setClicks((prev) => prev.filter((click) => click.id !== clickId));
    }, 1000);

    // Increment click count for secret box
    setClickCount((prev) => prev + 1);
  };

  // Trigger secret box on 4 clicks and reset
  useEffect(() => {
    if (clickCount >= 4) {
      onSecretLineClick();
      setClickCount(0); // Reset after triggering
    }
    // Reset click count after 2 seconds if not enough clicks
    const timeout = setTimeout(() => {
      setClickCount(0);
    }, 2000);
    return () => clearTimeout(timeout); // Cleanup timeout
  }, [clickCount, onSecretLineClick]);

  return (
    <footer className="mt-20 py-8 px-4 text-center border-t bg-black">
      <div className="max-w-4xl mx-auto flex justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-white">Features</h3>
          <div className="text-sm space-y-1">
            <p className="text-white">One-click copy</p>
            <p className="text-white">Visual references</p>
            <p className="text-white">Category filters</p>
            <p className="text-white">Search functionality</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-white">Categories</h3>
          <div className="text-sm space-y-1">
            <p className="text-white">Men</p>
            <p className="text-white">Women</p>
            <p className="text-white">Couple</p>
            <p className="text-white">Kids</p>
          </div>
        </div>
      </div>

      <p className="text-sm mt-4 text-white">
        Made with{" "}
        <span
          className="inline-block animate-pulse-heart"
          style={{
            animation: "pulseHeart 1.5s ease-in-out infinite",
          }}
        >
          ♡
        </span>
      </p>

      <style>
        {`
          @keyframes pulseHeart {
            0% {
              color: white;
              transform: scale(1);
            }
            50% {
              color: red;
              transform: scale(1.2);
            }
            100% {
              color: white;
              transform: scale(1);
            }
          }
          .click-dot {
            position: absolute;
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: fadeOut 1s ease-in-out;
            pointer-events: none;
          }
          @keyframes fadeOut {
            0% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(1.5);
            }
          }
        `}
      </style>

      {/* Secret silver line */}
      <div
        className="mt-8 mx-auto max-w-md h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent cursor-pointer hover:via-gray-500 transition-all relative"
        onClick={handleLineClick}
        title="Click four times for secret access"
      >
        {clicks.map((click) => (
          <div
            key={click.id}
            className="click-dot"
            style={{
              left: `${click.x}px`,
              top: '50%',
            }}
          />
        ))}
      </div>
    </footer>
  );
};

export default Footer;