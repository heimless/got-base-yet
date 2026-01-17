"use client";
import { useEffect, useState, useCallback, useRef, useMemo, memo } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHECK_IN_CONTRACT_ADDRESS, CHECK_IN_ABI } from "./contracts/checkIn";
import styles from "./page.module.css";

// ============================================================================
// Constants
// ============================================================================

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$@#%&";
const SCRAMBLE_DURATION = 700; // Under 800ms per Base motion guidelines
const SCRAMBLE_ITERATIONS = 8;

// ============================================================================
// ScrambleText Component - Base brand "tech scramble" animation
// ============================================================================

interface ScrambleTextProps {
  text: string;
  highlightWord?: string;
  highlightClassName?: string;
}

const ScrambleText = memo(function ScrambleText({ 
  text, 
  highlightWord,
  highlightClassName 
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  const chars = useMemo(() => text.split(''), [text]);
  
  useEffect(() => {
    setDisplayText(chars.map(c => 
      c === ' ' ? ' ' : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
    ));
    
    const iterationTime = SCRAMBLE_DURATION / SCRAMBLE_ITERATIONS;
    let iteration = 0;
    
    const interval = setInterval(() => {
      iteration++;
      
      setDisplayText(chars.map((char, i) => {
        if (char === ' ') return ' ';
        
        const resolveAt = Math.floor((i / chars.length) * SCRAMBLE_ITERATIONS) + 2;
        if (iteration >= resolveAt) return char;
        
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }));
      
      if (iteration >= SCRAMBLE_ITERATIONS) {
        clearInterval(interval);
        setDisplayText(chars);
        setIsComplete(true);
      }
    }, iterationTime);
    
    return () => clearInterval(interval);
  }, [chars]);
  
  const renderedContent = useMemo(() => {
    const fullText = displayText.join('');
    
    if (!highlightWord) return fullText;
    
    const highlightIndex = text.indexOf(highlightWord);
    if (highlightIndex === -1) return fullText;
    
    return (
      <>
        {fullText.slice(0, highlightIndex)}
        <span className={highlightClassName}>
          {fullText.slice(highlightIndex, highlightIndex + highlightWord.length)}
        </span>
        {fullText.slice(highlightIndex + highlightWord.length)}
      </>
    );
  }, [displayText, text, highlightWord, highlightClassName]);
  
  return (
    <span className={isComplete ? styles.scrambleComplete : styles.scrambleAnimating}>
      {renderedContent}
    </span>
  );
});

// ============================================================================
// App Constants
// ============================================================================

const STORAGE_KEY = "got-base-yet-calendar";
const CALENDAR_DAYS = 7;
const BUTTON_DEBOUNCE_MS = 500;
const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || "WPB5T7J7S1HSCZAA7QBFIEPCZXNJKWRPSV";

// ============================================================================
// Utility Functions
// ============================================================================
function parseErrorMessage(error: Error | null | undefined): string {
  if (!error?.message) return "Transaction failed. Please try again.";
  
  const msg = error.message.toLowerCase();
  
  // User rejected
  if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled")) {
    return "Transaction cancelled";
  }
  
  // Insufficient funds
  if (msg.includes("insufficient funds") || msg.includes("insufficient balance")) {
    return "Insufficient ETH for gas fees";
  }
  
  // Network issues
  if (msg.includes("network") || msg.includes("connection")) {
    return "Network error. Check your connection";
  }
  
  // Contract errors
  if (msg.includes("execution reverted")) {
    return "Transaction failed on-chain";
  }
  
  // Default: truncate long messages
  const original = error.message;
  if (original.length > 60) {
    return original.substring(0, 57) + "...";
  }
  
  return original;
}

// ============================================================================
// Medal System
// ============================================================================

const MEDALS = {
  diamond: { threshold: 200, emoji: "💎", label: "Diamond" },
  gold: { threshold: 150, emoji: "🥇", label: "Gold" },
  silver: { threshold: 100, emoji: "🥈", label: "Silver" },
  bronze: { threshold: 50, emoji: "🥉", label: "Bronze" },
} as const;

type MedalType = keyof typeof MEDALS | null;

interface CalendarData {
  [dateKey: string]: "no" | "yes";
}

// Get current medal based on NO days count
function getMedal(noDaysCount: number): MedalType {
  if (noDaysCount >= MEDALS.diamond.threshold) return "diamond";
  if (noDaysCount >= MEDALS.gold.threshold) return "gold";
  if (noDaysCount >= MEDALS.silver.threshold) return "silver";
  if (noDaysCount >= MEDALS.bronze.threshold) return "bronze";
  return null;
}

// Count current streak of consecutive NO days (resets on miss)
function countNoDays(data: CalendarData): number {
  const today = getToday();
  let streak = 0;
  
  // Start from today and go backwards
  for (let i = 0; i <= 365; i++) { // Check up to 1 year back
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = getDateKey(date);
    
    if (data[dateKey] === "no") {
      streak++;
    } else if (data[dateKey] === "yes") {
      // YES counts as active day, continue streak
      streak++;
    } else {
      // No data for this day = missed = streak breaks
      // But skip today if not yet marked (user hasn't acted yet)
      if (i === 0 && data[dateKey] === undefined) {
        continue; // Today not marked yet, check yesterday
      }
      break; // Streak broken
    }
  }
  
  return streak;
}

// Get date string in YYYY-MM-DD format (local timezone)
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's date at midnight (local time)
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Get day of week abbreviation
function getDayAbbr(date: Date): string {
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return days[date.getDay()];
}

// Generate calendar days starting from (CALENDAR_DAYS - 1) days ago
function generateCalendarDays(): Date[] {
  const today = getToday();
  const days: Date[] = [];
  
  for (let i = CALENDAR_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(date);
  }
  
  return days;
}

// ============================================================================
// Main Component
// ============================================================================

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { isConnected, address } = useAccount();
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "confirming" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [txCount, setTxCount] = useState<number | null>(null);
  const [isTxCountLoading, setIsTxCountLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<"no" | "yes" | null>(null);
  
  // Debounce protection
  const lastClickRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  // Contract write hook
  const { 
    data: hash, 
    writeContract, 
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite
  } = useWriteContract();

  // Wait for transaction receipt
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({ hash });

  // Initialize MiniKit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Fetch transaction count from BaseScan
  useEffect(() => {
    async function fetchTxCount() {
      if (!address) {
        setTxCount(null);
        return;
      }

      setIsTxCountLoading(true);
      try {
        const response = await fetch(
          `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=txlist&address=${address}&sort=desc&apikey=${BASESCAN_API_KEY}`
        );
        const data = await response.json();
        
        if (data.status === "1" && Array.isArray(data.result)) {
          setTxCount(data.result.length);
        } else if (data.status === "0" && data.message === "No transactions found") {
          setTxCount(0);
        } else {
          console.error("BaseScan API error:", data.message);
          setTxCount(null);
        }
      } catch (error) {
        console.error("Failed to fetch tx count:", error);
        setTxCount(null);
      } finally {
        setIsTxCountLoading(false);
      }
    }

    fetchTxCount();
  }, [address, isConfirmed]); // Refetch when address changes or after successful transaction

  // Load data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCalendarData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load calendar data:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  const saveData = useCallback((data: CalendarData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save calendar data:", e);
    }
  }, []);

  // Update status based on transaction state
  useEffect(() => {
    if (isWritePending) {
      setTxStatus("pending");
      isProcessingRef.current = true;
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (writeError || confirmError) {
      setTxStatus("error");
      setErrorMessage(parseErrorMessage(writeError || confirmError));
      isProcessingRef.current = false;
      setPendingAction(null);
    }
  }, [isWritePending, isConfirming, writeError, confirmError]);

  // Handle successful transaction - mark calendar
  useEffect(() => {
    if (isConfirmed && txStatus !== "success" && pendingAction) {
      setTxStatus("success");
      const todayKey = getDateKey(getToday());
      const newData = { ...calendarData, [todayKey]: pendingAction };
      setCalendarData(newData);
      saveData(newData);
      setPendingAction(null);
      isProcessingRef.current = false;
    }
  }, [isConfirmed, txStatus, calendarData, saveData, pendingAction]);

  // Handle button click - send transaction
  const handleButtonClick = useCallback((action: "no" | "yes") => {
    // Debounce protection - prevent rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < BUTTON_DEBOUNCE_MS) {
      return;
    }
    lastClickRef.current = now;
    
    // Prevent multiple simultaneous transactions
    if (isProcessingRef.current) {
      return;
    }
    
    // Check if already marked today
    const todayKey = getDateKey(getToday());
    if (calendarData[todayKey] !== undefined) {
      return;
    }

    setErrorMessage("");
    setTxStatus("idle");
    resetWrite();
    setPendingAction(action);

    if (!isConnected) {
      setErrorMessage("Connect your wallet to check in");
      setTxStatus("error");
      setPendingAction(null);
      return;
    }

    // Mark as processing
    isProcessingRef.current = true;

    // Send the checkIn transaction
    try {
      writeContract({
        address: CHECK_IN_CONTRACT_ADDRESS,
        abi: CHECK_IN_ABI,
        functionName: "checkIn",
      });
    } catch (e) {
      console.error("Write contract error:", e);
      setTxStatus("error");
      setErrorMessage("Failed to initiate transaction");
      setPendingAction(null);
      isProcessingRef.current = false;
    }
  }, [isConnected, writeContract, resetWrite, calendarData]);

  const handleNo = useCallback(() => handleButtonClick("no"), [handleButtonClick]);
  const handleYes = useCallback(() => handleButtonClick("yes"), [handleButtonClick]);

  // Reset transaction state
  const handleRetry = useCallback(() => {
    setTxStatus("idle");
    setErrorMessage("");
    setPendingAction(null);
    isProcessingRef.current = false;
    resetWrite();
  }, [resetWrite]);

  // Memoize calendar calculations
  const { calendarDays, todayKey } = useMemo(() => ({
    calendarDays: generateCalendarDays(),
    todayKey: getDateKey(getToday()),
  }), []);

  // Memoized day status calculator
  const getDayStatus = useCallback((date: Date): "empty" | "no" | "yes" | "missed" => {
    const dateKey = getDateKey(date);
    const today = getToday();
    
    if (calendarData[dateKey]) return calendarData[dateKey];
    if (dateKey === todayKey) return "empty";
    if (date < today) return "missed";
    
    return "empty";
  }, [calendarData, todayKey]);

  // Check if today is already marked
  const isTodayMarked = calendarData[todayKey] !== undefined;
  const isTransactionInProgress = txStatus === "pending" || txStatus === "confirming";
  const isButtonDisabled = isTodayMarked || isTransactionInProgress;

  // Calculate NO days count and medal
  const noDaysCount = countNoDays(calendarData);
  const currentMedal = getMedal(noDaysCount);
  const nextMedal = !currentMedal ? MEDALS.bronze 
    : currentMedal === "bronze" ? MEDALS.silver
    : currentMedal === "silver" ? MEDALS.gold
    : currentMedal === "gold" ? MEDALS.diamond
    : null;
  const daysToNextMedal = nextMedal ? nextMedal.threshold - noDaysCount : 0;

  // Get status message
  const getStatusMessage = () => {
    if (txStatus === "pending") return "Confirm in your wallet...";
    if (txStatus === "confirming") return "Confirming transaction...";
    if (txStatus === "error") return errorMessage || "Transaction failed";
    if (isTodayMarked) {
      return calendarData[todayKey] === "no" 
        ? "Come back tomorrow! 💪" 
        : "Nice! You got $BASE! 🎉";
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className={styles.container}>
      {/* Corner decorations */}
      <div className={styles.purpleSquare} title="Your Base transactions">
        {isTxCountLoading ? (
          <span className={styles.cornerSpinner} />
        ) : txCount !== null ? (
          <span className={styles.txCountText}>{txCount > 999 ? "999+" : txCount}</span>
        ) : null}
      </div>
      <div 
        className={styles.blueSquare} 
        title={currentMedal 
          ? `${MEDALS[currentMedal].label} Medal (${noDaysCount} days)${nextMedal ? ` - ${daysToNextMedal} to ${nextMedal.label}` : ""}` 
          : `${noDaysCount} days - ${daysToNextMedal} to Bronze`}
      >
        {currentMedal ? (
          <span className={styles.medalEmoji}>{MEDALS[currentMedal].emoji}</span>
        ) : noDaysCount > 0 ? (
          <span className={styles.daysCount}>{noDaysCount}</span>
        ) : null}
      </div>

      {/* Main content */}
      <div className={styles.content}>
        <h1 className={styles.title}>
          <ScrambleText 
            text="GOT $BASE YET?" 
            highlightWord="$BASE"
            highlightClassName={styles.highlight}
          />
        </h1>

        {/* Calendar row */}
        <div className={styles.calendarRow}>
          {calendarDays.map((date) => {
            const dateKey = getDateKey(date);
            const isToday = dateKey === todayKey;
            const dayAbbr = getDayAbbr(date);
            
            // Show skeleton while loading
            if (!isLoaded) {
              return (
                <div key={dateKey} className={`${styles.calendarDay} ${styles.calendarDaySkeleton}`} />
              );
            }
            
            const status = getDayStatus(date);
            
            return (
              <div
                key={dateKey}
                className={`
                  ${styles.calendarDay}
                  ${status === "no" ? styles.calendarDayNo : ""}
                  ${status === "yes" ? styles.calendarDayYes : ""}
                  ${status === "missed" ? styles.calendarDayMissed : ""}
                  ${isToday ? styles.calendarDayToday : ""}
                `}
                title={`${date.toLocaleDateString()} (${isToday ? 'Today' : dayAbbr})`}
              >
                {status === "missed" && <span className={styles.missedX}>✕</span>}
                {status === "empty" && <span className={styles.dayLabel}>{dayAbbr}</span>}
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          {(["no", "yes"] as const).map((action) => {
            const isNo = action === "no";
            const isLoading = isTransactionInProgress && pendingAction === action;
            
            return (
              <button
                key={action}
                className={`${isNo ? styles.noButton : styles.yesButton} ${isButtonDisabled ? styles.buttonDisabled : ""}`}
                type="button"
                onClick={isNo ? handleNo : handleYes}
                disabled={isButtonDisabled}
              >
                {isLoading ? (
                  <span className={styles.buttonLoading}>
                    <span className={styles.spinner} />
                    {txStatus === "pending" ? "CONFIRM..." : "SENDING..."}
                  </span>
                ) : (
                  action.toUpperCase()
                )}
              </button>
            );
          })}
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className={styles.statusContainer}>
            <p className={`${styles.statusMessage} ${txStatus === "error" ? styles.statusError : ""}`}>
              {statusMessage}
            </p>
            {txStatus === "error" && (
              <button className={styles.retryButton} onClick={handleRetry}>
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Transaction hash link */}
        {hash && txStatus === "success" && (
          <a 
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.txLink}
          >
            View on BaseScan ↗
          </a>
        )}
      </div>
    </div>
  );
}
