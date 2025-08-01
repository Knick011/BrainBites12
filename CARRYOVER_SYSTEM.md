# Daily Score Carryover System

## Overview

The Daily Score Carryover System is a comprehensive feature that handles score calculations based on remaining time and overtime at midnight. It provides both positive bonuses for unused time and penalties for overtime usage.

## Architecture

### Native Android Components

1. **DailyScoreCarryoverService.kt** - Core service that handles:
   - End-of-day score calculations
   - Positive score for unused time (10 points per minute)
   - Negative score for overtime (5 points per minute penalty)
   - Daily data reset and carryover application

2. **DailyScoreCarryoverModule.kt** - React Native bridge that provides:
   - `getTodayStartScore()` - Gets carryover score for the day
   - `getCarryoverInfo()` - Gets detailed carryover information
   - `checkAndProcessNewDay()` - Processes new day detection
   - `processEndOfDay()` - Manually triggers end-of-day processing

3. **DailyScoreCarryoverPackage.kt** - Package registration for React Native

### React Native Components

1. **EnhancedScoreService.ts** - Updated to integrate with carryover:
   - `checkAndApplyCarryover()` - Applies carryover scores on daily reset
   - `getCarryoverInfo()` - Gets carryover information from native module
   - Automatic carryover application when new day is detected

2. **CarryoverInfoCard.tsx** - UI component that displays:
   - Remaining time and potential bonus
   - Overtime and potential penalty
   - Expandable interface with detailed information
   - Visual indicators for positive/negative carryover

## Score Calculation

### Positive Carryover (Unused Time)
- **Rate**: 10 points per minute of unused time
- **Example**: 30 minutes remaining = +300 points tomorrow

### Negative Carryover (Overtime)
- **Rate**: 5 points per minute of overtime (penalty)
- **Example**: 20 minutes overtime = -100 points tomorrow

## Integration Points

### HomeScreen
The `CarryoverInfoCard` is integrated into the HomeScreen after the Timer Widget, providing users with real-time information about their potential carryover score.

### Daily Reset Process
1. At midnight or when a new day is detected
2. `DailyScoreCarryoverService` calculates carryover based on timer state
3. `EnhancedScoreService` applies carryover to daily score
4. User is notified via toast message about applied carryover

## Usage

### For Users
- The carryover card appears automatically when there's potential carryover
- Tap to expand and see detailed information
- Positive carryover shows green indicators
- Negative carryover shows red warning indicators

### For Developers
```typescript
// Get carryover information
const carryoverInfo = await EnhancedScoreService.getCarryoverInfo();

// Check if carryover was applied
const scoreInfo = EnhancedScoreService.getScoreInfo();
```

## Configuration

### Score Rates
The carryover rates can be adjusted in `DailyScoreCarryoverService.kt`:
```kotlin
private const val MINUTES_TO_POINTS_POSITIVE = 10 // 10 points per minute
private const val MINUTES_TO_POINTS_NEGATIVE = 5  // 5 points per minute penalty
```

### Storage Keys
The system uses separate SharedPreferences for carryover data:
- `BrainBitesScoreCarryover` - Carryover-specific data
- `BrainBitesTimerPrefs` - Timer data (existing)

## Benefits

1. **Motivates Time Management**: Users are incentivized to use their time wisely
2. **Prevents Overtime Abuse**: Penalties discourage excessive overtime usage
3. **Rewards Efficiency**: Bonus points for completing tasks quickly
4. **Daily Engagement**: Creates daily goals and consequences
5. **Visual Feedback**: Clear UI shows potential impact

## Future Enhancements

- Weekly carryover limits
- Streak bonuses for consistent time management
- Social features (compare carryover with friends)
- Advanced analytics and insights
- Customizable carryover rates based on user preferences 