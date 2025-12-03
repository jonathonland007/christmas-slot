# COMPREHENSIVE TEXT ELEMENTS REFERENCE
## Evil Eddie's Rat-mas Special Game UI

### 📋 COMPLETE TEXT ELEMENT INVENTORY

#### 🎯 MAIN UI ELEMENTS (GAME INTERFACE)

1. **BALANCE DISPLAY**
   - **Class:** `.balance-label`
   - **Text:** "BALANCE"
   - **Font Size:** `1.6vw`
   - **Color:** `#ffffff`
   - **HTML:** `<span class="balance-label">BALANCE</span>`

2. **BALANCE AMOUNT**
   - **Class:** `.balance-amount`
   - **Text:** Dynamic balance value
   - **Font Size:** `1.8vw`
   - **Color:** `#ffffff`
   - **HTML:** `<span class="balance-amount" id="balance-amount">€100.00</span>`

3. **BET AMOUNT (Large)**
   - **Class:** `.bet-amount-large`
   - **Text:** Dynamic bet value
   - **Font Size:** `1.9vw`
   - **Color:** `#ffffff`
   - **HTML:** `<span class="bet-amount-large" id="bet-amount-large">€1.00</span>`

4. **BET AMOUNT (Standard)**
   - **Class:** `.bet-amount`
   - **Text:** Dynamic bet value
   - **Font Size:** `1.2vw`
   - **Color:** `#ffffff`
   - **Used in:** Smaller bet displays

5. **LAST WIN LABEL**
   - **Class:** `.last-win-label`
   - **Text:** "LAST WIN"
   - **Font Size:** `1.4vw`
   - **Color:** `#ffffff`
   - **HTML:** `<span class="last-win-label">LAST WIN</span>`

6. **LAST WIN AMOUNT**
   - **Class:** `.last-win-amount`
   - **Text:** Dynamic win value
   - **Font Size:** `1.6vw`
   - **Color:** `#ffffff`
   - **HTML:** `<span class="last-win-amount" id="last-win-amount">€0.00</span>`

7. **BUTTON LABELS (Generic)**
   - **Class:** `.button-label`
   - **Text:** Various button labels
   - **Font Size:** `1.8vw`
   - **Color:** `#ffd700` (Gold)
   - **Position:** Top 15% of buttons

8. **ACTION BUTTON TEXT**
   - **Class:** `.action-buttons-group .button-text`
   - **Text:** "SPIN", "STOP", etc.
   - **Font Size:** `1.8vw`
   - **Color:** `#ffffff`
   - **Used in:** Main action buttons

9. **BONUS BUY BUTTON TEXT**
   - **Class:** `.bonus-buy-button .button-text`
   - **Text:** "BONUS BUY"
   - **Font Size:** `1.8vw`
   - **Color:** `#ffffff`
   - **Hover Color:** `#FFD700`

10. **LINES/WIN AMOUNTS**
    - **Classes:** `.lines-amount`, `.win-amount`
    - **Font Size:** `1.2vw`
    - **Color:** `#ffffff`
    - **Used in:** Various UI elements

#### 🎪 AUTOPLAY POPUP ELEMENTS

11. **AUTOPLAY POPUP HEADING**
    - **Class:** `.popup-text h3`
    - **Text:** "AUTO PLAY"
    - **Font Size:** `1.8em`
    - **Color:** `#ffffff`

12. **AUTOPLAY OPTIONS**
    - **Class:** `.autoplay-option`
    - **Text:** "10 SPINS", "25 SPINS", etc.
    - **Font Size:** `2.8vh`
    - **Color:** `white`
    - **Background:** Green gradient

13. **CHECKBOX LABEL**
    - **Class:** `.checkbox-label`
    - **Text:** "Stop on Bonus Game"
    - **Font Size:** `3.2vh`
    - **Color:** `white`

#### 🎁 BONUS BUY POPUP ELEMENTS

14. **BONUS TITLE**
    - **Class:** `.bonus-title`
    - **Text:** "CHRISTMAS BONUS"
    - **Font Size:** `1.92vw`
    - **Color:** `#FFD700` (Gold)
    - **Position:** Top of bonus popup

15. **BONUS DESCRIPTION**
    - **Class:** `.bonus-description`
    - **Text:** "Play instantly for Christmas bonus features!"
    - **Font Size:** `1.28vw`
    - **Color:** `#ffffff`

16. **BONUS BET LABEL**
    - **Class:** `.bonus-bet-label`
    - **Text:** "Play Amount:"
    - **Font Size:** `1.28vw`
    - **Color:** `#FFD700`

17. **BONUS BET DISPLAY**
    - **Class:** `.bonus-bet-display`
    - **Text:** Dynamic bet amount (e.g., "€1.00")
    - **Font Size:** `1.44vw`
    - **Color:** `#FFD700`
    - **Background:** Semi-transparent with gold border

18. **BONUS OPTION HEADING**
    - **Class:** `.bonus-option-content h3`
    - **Text:** "Christmas Magic Bonus"
    - **Font Size:** `1.44vw`
    - **Color:** `#FFD700`

19. **BONUS OPTION DESCRIPTION**
    - **Class:** `.bonus-option-content p`
    - **Text:** "Trigger the bonus game with enhanced features and free spins"
    - **Font Size:** `1.12vw`
    - **Color:** `#ffffff`

20. **BONUS COST**
    - **Class:** `.bonus-cost`
    - **Text:** Dynamic cost (e.g., "€100.00")
    - **Font Size:** `1.76vw`
    - **Color:** `#FFD700`

21. **BONUS PURCHASE BUTTON TEXT**
    - **Class:** `.bonus-purchase-btn .button-text`
    - **Text:** "GET BONUS"
    - **Font Size:** `1.28vw`
    - **Color:** `#ffffff`

#### 🎪 BONUS CONFIRMATION POPUP ELEMENTS

22. **CONFIRMATION TITLE**
    - **Class:** `.confirmation-title`
    - **Text:** "BONUS CONFIRMATION"
    - **Font Size:** `1.76vw`
    - **Color:** `#FFD700`

23. **CONFIRMATION MESSAGE**
    - **Class:** `.confirmation-message p`
    - **Text:** "Are you sure you want to play for"
    - **Font Size:** `1.28vw`
    - **Color:** `#ffffff`

24. **BONUS NAME (in confirmation)**
    - **Class:** `.bonus-name`
    - **Text:** "Christmas Magic Bonus"
    - **Font Size:** `1.44vw !important`
    - **Color:** `#FFD700 !important`

25. **BONUS BUY COST (in confirmation)**
    - **ID:** `#bonus-buy-cost`
    - **Text:** Dynamic cost
    - **Font Size:** `1.6vw`
    - **Color:** `#FFD700`

26. **CONFIRMATION DETAILS**
    - **Class:** `.confirmation-details p`
    - **Text:** "This will trigger the Christmas bonus game..."
    - **Font Size:** `1.12vw`
    - **Color:** `#ffffff`

27. **CONFIRMATION BUTTONS**
    - **Classes:** `.confirm-btn`, `.purchase-btn`, `.cancel-btn`
    - **Text:** "GET BONUS", "CANCEL"
    - **Font Size:** `1.28vw`
    - **Colors:** White text, different background gradients

#### 🎊 SPECIAL OVERLAY ELEMENTS

28. **BONUS INTRO HEADING**
    - **Class:** `.bonus-intro-content h2`
    - **Font Size:** `5vh`
    - **Color:** `#ffd700`
    - **Animation:** Pulse scale

29. **BONUS INTRO DESCRIPTION**
    - **Class:** `.bonus-intro-content div`
    - **Font Size:** `2.5vh`
    - **Color:** `#ffd700`

30. **GAME DISCLAIMER**
    - **Class:** `.game-disclaimer`
    - **Font Size:** `0.8vh`
    - **Color:** `#ccc`
    - **Position:** Fixed bottom

31. **REPLAY INDICATOR**
    - **Class:** `.replay-indicator`
    - **Font Size:** `2vw`
    - **Color:** `white`
    - **Background:** Red with opacity animation

### 🎨 FONT SYSTEM STATUS

**Primary Font:** `"Fredoka One", Arial, sans-serif`
**Text Stroke:** `0.02vw rgba(0,0,0,0.6)` (Applied to body)
**Font Weight:** `bold` (Applied globally)

### 📝 NOTES

- All text elements use the Fredoka One font from Google Fonts
- Text stroke provides contrast against varied backgrounds
- Responsive sizing uses `vw` (viewport width) and `vh` (viewport height) units
- Gold color (`#FFD700`) used for highlighting and important elements
- White (`#ffffff`) used for primary text content
- All elements have text-shadow for additional contrast

### 🔧 MAINTENANCE CHECKLIST

✅ Balance display elements - Updated
✅ Bet amount displays - Updated  
✅ Last win elements - Updated
✅ Button text elements - Updated
✅ Autoplay popup elements - Updated
✅ Bonus popup elements - Need verification
✅ Confirmation popup elements - Need verification
✅ Special overlay elements - Need verification

### 🎯 QUICK REFERENCE IDS & CLASSES

**Key Dynamic Elements:**
- `#balance-amount` - Balance value
- `#bet-amount-large` - Main bet display
- `#last-win-amount` - Last win value
- `#bonus-bet-display` - Bonus popup bet amount
- `#bonus-cost-display` - Bonus cost in popup
- `#bonus-buy-cost` - Bonus cost in confirmation

**Main Text Classes:**
- `.balance-label`, `.balance-amount`
- `.bet-amount-large`, `.bet-amount`
- `.last-win-label`, `.last-win-amount`
- `.button-label`, `.button-text`
- `.bonus-title`, `.bonus-description`
- `.confirmation-title`, `.confirmation-message`