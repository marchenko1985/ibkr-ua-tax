import { strategies, type Strategy } from "./strategies";

export type StockPosition = {
  type: "stock";
  position: number;
  basis?: number;
};

export type OptionContract = {
  type: "call" | "put";
  position: number;
  strike: number;
  dte: number;
  multiplier?: number;
};

export type Position = StockPosition | OptionContract;

function isStockPosition(position?: Position): position is StockPosition {
  return position?.type === "stock" && typeof position.position === "number";
}

function isOptionContract(position?: Position): position is OptionContract {
  return (position?.type === "call" || position?.type === "put") && typeof position.position === "number" && typeof position.strike === "number" && typeof position.dte === "number";
}

/**
 * Detects which strategy matches the given positions
 * @param positions - The positions object containing option and stock positions
 * @returns The matching strategy definition
 */
export function detectType(positions: (OptionContract | StockPosition)[], isCashSecured = false): Strategy {
  // Extract enabled positions
  const enabledPositions = positions.filter((position) => position.position !== 0);

  // Sort option positions by strike, expiration, position, and type
  const optionPositions = enabledPositions.filter(isOptionContract).sort((a, b) => {
    const strikeComparison = a.strike - b.strike;
    if (strikeComparison === 0) {
      const dteComparison = a.dte - b.dte;
      if (dteComparison === 0) {
        const positionComparison = b.position - a.position;
        // call = 1, put = 2
        if (positionComparison === 0) {
          const aType = a.type === "call" ? 1 : 2;
          const bType = b.type === "call" ? 1 : 2;
          return aType - bType;
        }
        return positionComparison;
      }
      return dteComparison;
    }
    return strikeComparison;
  });

  // Sort stock positions by cost basis
  const stockPositions = enabledPositions.filter(isStockPosition).sort((a, b) => (a.basis ?? 0) - (b.basis ?? 0));

  // Get series and strikes
  const series = Array.from(new Set(optionPositions.map((p) => p.dte)));
  const strikes = Array.from(new Set(optionPositions.map((p) => p.strike)));

  // Check common position characteristics
  const allLong = optionPositions.every((p) => p.position > 0);
  const allShort = optionPositions.every((p) => p.position < 0);
  const allCalls = optionPositions.every((p) => p.type === "call");
  const allPuts = optionPositions.every((p) => p.type === "put");
  const sameSize = optionPositions.every((p) => Math.abs(p.position) === Math.abs(optionPositions[0].position));
  const sameExpiration = optionPositions.every((p) => p.dte === optionPositions[0].dte);

  // No positions
  if (enabledPositions.length === 0) {
    return strategies.empty;
  }

  // Single position
  if (enabledPositions.length === 1) {
    const position = enabledPositions[0];

    if (isStockPosition(position)) {
      return position.position > 0 ? strategies.longEquity : strategies.shortEquity;
    }

    if (isOptionContract(position)) {
      if (position.position > 0) {
        if (position.type === "call") {
          return strategies.longCall;
        }
        // if (position.type === "put") {
        return strategies.longPut;
        // }
      } else if (position.position < 0) {
        if (position.type === "call") {
          return strategies.shortCall;
        }
        // if (position.type === "put") {
        return isCashSecured ? strategies.cashSecuredPut : strategies.shortPut;
        // }
      }
    }
  }

  // Two positions
  else if (enabledPositions.length === 2) {
    // Two options
    if (optionPositions.length === 2) {
      // assert(optionPositions[0]);
      // assert(optionPositions[1]);
      // Different expiration dates - calendar and diagonal spreads
      if (series.length === 2) {
        const frontShort = (optionPositions[0].dte < optionPositions[1].dte ? optionPositions[0] : optionPositions[1]).position < 0;

        if (allCalls && optionPositions[0].position !== optionPositions[1].position) {
          if (strikes.length === 1) return frontShort ? strategies.calendarCallSpread : strategies.reverseCalendarCallSpread;
          if (strikes.length === 2) return frontShort ? strategies.diagonalCallSpread : strategies.reverseDiagonalCallSpread;
        } else if (allPuts && optionPositions[0].position !== optionPositions[1].position) {
          if (strikes.length === 1) return frontShort ? strategies.calendarPutSpread : strategies.reverseCalendarPutSpread;
          if (strikes.length === 2) return frontShort ? strategies.diagonalPutSpread : strategies.reverseDiagonalPutSpread;
        }
      }
      // Same expiration date
      else if (sameExpiration) {
        // Same size for both options
        if (sameSize) {
          // Vertical spreads
          if (allCalls && optionPositions[0].position > 0 && optionPositions[1].position < 0) return strategies.bullCallSpread;
          if (allCalls && optionPositions[0].position < 0 && optionPositions[1].position > 0) return strategies.bearCallSpread;
          if (allPuts && optionPositions[0].position < 0 && optionPositions[1].position > 0) return strategies.bearPutSpread;
          if (allPuts && optionPositions[0].position > 0 && optionPositions[1].position < 0) return strategies.bullPutSpread;

          // Put-call combinations
          if (optionPositions[0].type === "put" && optionPositions[1].type === "call") {
            if (optionPositions[0].strike < optionPositions[1].strike) {
              if (optionPositions[1].position < 0 && optionPositions[0].position > 0) return strategies.shortCombo;
              if (optionPositions[0].position < 0 && optionPositions[1].position > 0) return strategies.longCombo;
            } else if (optionPositions[0].strike === optionPositions[1].strike && optionPositions[1].position < 0 && optionPositions[0].position > 0) return strategies.shortSyntheticFuture;
          } else if (optionPositions[0].type === "call" && optionPositions[1].type === "put" && optionPositions[0].strike === optionPositions[1].strike && optionPositions[0].position > 0 && optionPositions[1].position < 0) return strategies.longSyntheticFuture;
        }

        // Ratio spreads
        if (allCalls && 2 * Math.abs(optionPositions[0].position) === Math.abs(optionPositions[1].position)) {
          if (optionPositions[0].position > 0 && optionPositions[1].position < 0) return strategies.ratioCallSpread;
          if (optionPositions[1].position > 0 && optionPositions[0].position < 0) return strategies.callRatioBackspread;
        }
        if (allPuts && Math.abs(optionPositions[0].position) === 2 * Math.abs(optionPositions[1].position)) {
          if (optionPositions[1].position > 0 && optionPositions[0].position < 0) return strategies.ratioPutSpread;
          if (optionPositions[0].position > 0 && optionPositions[1].position < 0) return strategies.putRatioBackspread;
        }

        // Guts and strangles
        if (optionPositions[0].strike < optionPositions[1].strike && optionPositions[0].type === "call" && optionPositions[1].type === "put" && sameSize) {
          if (allLong) return strategies.guts;
          if (allShort) return strategies.shortGuts;
        }
        if (optionPositions[0].strike < optionPositions[1].strike && optionPositions[0].type === "put" && optionPositions[1].type === "call" && sameSize) {
          if (allLong) return strategies.strangle;
          if (allShort) return strategies.shortStrangle;
        }

        // Straddles and other combinations at same strike
        if (optionPositions[0].strike === optionPositions[1].strike) {
          if (optionPositions[0].type === "call" && optionPositions[1].type === "put") {
            if (allLong) {
              if (Math.abs(optionPositions[0].position) === 2 * Math.abs(optionPositions[1].position)) return strategies.strap;
              if (Math.abs(optionPositions[0].position) === Math.abs(optionPositions[1].position)) return strategies.straddle;
            } else if (allShort) return strategies.shortStraddle;
          } else if (optionPositions[0].type === "put" && optionPositions[1].type === "call" && allLong && Math.abs(optionPositions[0].position) === 2 * Math.abs(optionPositions[1].position)) return strategies.strip;
        }
      }
    }

    // One option and one stock
    else if (optionPositions.length === 1 && stockPositions.length === 1 && sameExpiration) {
      const stock = stockPositions[0];
      const option = optionPositions[0];
      const contractsPerShare = option.multiplier ?? 100; // Default to 100 shares per contract
      if (stock.position > 0 && option.position < 0 && option.type === "call" && Math.abs(stock.position) >= contractsPerShare) return strategies.coveredCall;
      if (stock.position > 0 && option.position > 0 && option.type === "put" && Math.abs(stock.position) >= contractsPerShare) return strategies.protectivePut;
      if (stock.position < 0 && option.position > 0 && option.type === "call" && Math.abs(stock.position) >= contractsPerShare) return strategies.syntheticPut;
    }
  }

  // Three positions
  else if (enabledPositions.length === 3 && sameExpiration) {
    // Three options
    if (optionPositions.length === 3) {
      // assert(optionPositions[0]);
      // assert(optionPositions[1]);
      // assert(optionPositions[2]);
      // Butterfly and broken wing patterns
      if (Math.abs(optionPositions[0].position) === Math.abs(optionPositions[2].position) && Math.abs(optionPositions[1].position) === 2 * Math.abs(optionPositions[0].position) && optionPositions[0].strike < optionPositions[1].strike && optionPositions[1].strike < optionPositions[2].strike) {
        // Call broken wings
        if (allCalls && optionPositions[1].strike - optionPositions[0].strike < optionPositions[2].strike - optionPositions[1].strike) {
          if (optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position > 0) return strategies.brokenWingCalls;
          if (optionPositions[0].position < 0 && optionPositions[1].position > 0 && optionPositions[2].position < 0) return strategies.inverseBrokenWingCalls;
        }
        // Put broken wings
        else if (allPuts && optionPositions[1].strike - optionPositions[0].strike > optionPositions[2].strike - optionPositions[1].strike) {
          if (optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position > 0) return strategies.brokenWingPuts;
          if (optionPositions[0].position < 0 && optionPositions[1].position > 0 && optionPositions[2].position < 0) return strategies.inverseBrokenWingPuts;
        }
        // Call butterflies
        else if (allCalls) {
          if (optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position > 0) return strategies.longCallButterfly;
          if (optionPositions[0].position < 0 && optionPositions[1].position > 0 && optionPositions[2].position < 0) return strategies.shortCallButterfly;
        }
        // Put butterflies
        else if (allPuts) {
          if (optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position > 0) return strategies.longPutButterfly;
          if (optionPositions[0].position < 0 && optionPositions[1].position > 0 && optionPositions[2].position < 0) return strategies.shortPutButterfly;
        }
      }

      // Ladder patterns
      if (sameSize && optionPositions[0].strike < optionPositions[1].strike && optionPositions[1].strike < optionPositions[2].strike) {
        if (allCalls) {
          if (optionPositions[0].position < 0 && optionPositions[1].position > 0 && optionPositions[2].position > 0) return strategies.bearCallLadder;
          if (optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position < 0) return strategies.bullCallLadder;
        } else if (allPuts) {
          if (optionPositions[0].position < 0 && optionPositions[1].position < 0 && optionPositions[2].position > 0) return strategies.bearPutLadder;
          if (optionPositions[0].position > 0 && optionPositions[1].position > 0 && optionPositions[2].position < 0) return strategies.bullPutLadder;
        }

        // Jade lizards
        if (optionPositions[0].position < 0 && optionPositions[1].position < 0 && optionPositions[2].position > 0 && optionPositions[0].type === "put" && optionPositions[1].type === "call" && optionPositions[2].type === "call") return strategies.jadeLizard;
        if (optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position < 0 && optionPositions[0].type === "put" && optionPositions[1].type === "put" && optionPositions[2].type === "call") return strategies.reverseJadeLizard;
      }
    }
    // Two options and one stock
    else if (optionPositions.length === 2 && sameSize) {
      // assert(optionPositions[0]);
      // assert(optionPositions[1]);
      // Collars and covered strangles/straddles
      if (optionPositions[0].strike < optionPositions[1].strike && optionPositions[0].type === "put" && optionPositions[1].type === "call" && allShort) return strategies.coveredShortStrangle;
      if (optionPositions[0].strike === optionPositions[1].strike && optionPositions[0].type === "call" && optionPositions[1].type === "put" && allShort) return strategies.coveredShortStraddle;
      if (optionPositions[0].strike < optionPositions[1].strike && optionPositions[0].type === "put" && optionPositions[1].type === "call" && optionPositions[0].position > 0 && optionPositions[1].position < 0) return strategies.collar;
    }
  }
  // Four positions
  else if (enabledPositions.length === 4) {
    // Four options with same size and expiration
    if (optionPositions.length === 4 && sameSize && sameExpiration) {
      // assert(optionPositions[0]);
      // assert(optionPositions[1]);
      // assert(optionPositions[2]);
      // assert(optionPositions[3]);
      // Condor and iron condor patterns
      if (optionPositions[0].strike < optionPositions[1].strike && optionPositions[1].strike < optionPositions[2].strike && optionPositions[2].strike < optionPositions[3].strike) {
        const patternLong = optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position < 0 && optionPositions[3].position > 0;
        const patternShort = optionPositions[0].position < 0 && optionPositions[1].position > 0 && optionPositions[2].position > 0 && optionPositions[3].position < 0;
        if (optionPositions[0].type === "put" && optionPositions[1].type === "put" && optionPositions[2].type === "call" && optionPositions[3].type === "call") {
          if (patternLong) return strategies.ironCondor;
          if (patternShort) return strategies.inverseIronCondor;
        } else if (allCalls) {
          if (patternLong) return strategies.longCallCondor;
          if (patternShort) return strategies.shortCallCondor;
        } else if (allPuts) {
          if (patternLong) return strategies.longPutCondor;
          if (patternShort) return strategies.shortPutCondor;
        }
      }

      // Iron butterfly patterns
      if (optionPositions[0].type === "put" && optionPositions[1].type === "call" && optionPositions[2].type === "put" && optionPositions[3].type === "call" && optionPositions[0].strike < optionPositions[1].strike && optionPositions[1].strike === optionPositions[2].strike && optionPositions[2].strike < optionPositions[3].strike) {
        if (optionPositions[0].position > 0 && optionPositions[1].position < 0 && optionPositions[2].position < 0 && optionPositions[3].position > 0) return strategies.ironButterfly;
        if (optionPositions[0].position < 0 && optionPositions[1].position > 0 && optionPositions[2].position > 0 && optionPositions[3].position < 0) return strategies.inverseIronButterfly;
      }
    }
    // Four options with same size but different expirations
    else if (optionPositions.length === 4 && sameSize && !sameExpiration) {
      // assert(optionPositions[0]);
      // assert(optionPositions[1]);
      // assert(optionPositions[2]);
      // assert(optionPositions[3]);
      // Double diagonal
      if (
        optionPositions[0].strike < optionPositions[1].strike &&
        optionPositions[1].strike < optionPositions[2].strike &&
        optionPositions[2].strike < optionPositions[3].strike &&
        optionPositions[0].type === "put" &&
        optionPositions[1].type === "put" &&
        optionPositions[2].type === "call" &&
        optionPositions[3].type === "call" &&
        optionPositions[0].position > 0 &&
        optionPositions[1].position < 0 &&
        optionPositions[2].position < 0 &&
        optionPositions[3].position > 0 &&
        optionPositions[0].dte > optionPositions[1].dte &&
        optionPositions[0].dte === optionPositions[3].dte &&
        optionPositions[1].dte === optionPositions[2].dte
      ) {
        return strategies.doubleDiagonal;
      }

      // Double calendar
      if (
        optionPositions[0].strike === optionPositions[1].strike &&
        optionPositions[1].strike < optionPositions[2].strike &&
        optionPositions[2].strike === optionPositions[3].strike &&
        optionPositions[0].type === "put" &&
        optionPositions[1].type === "put" &&
        optionPositions[2].type === "call" &&
        optionPositions[3].type === "call" &&
        optionPositions[0].position < 0 &&
        optionPositions[1].position > 0 &&
        optionPositions[2].position < 0 &&
        optionPositions[3].position > 0 &&
        optionPositions[0].dte < optionPositions[1].dte &&
        optionPositions[0].dte === optionPositions[2].dte &&
        optionPositions[1].dte === optionPositions[3].dte
      ) {
        return strategies.doubleCalendar;
      }
    }
  }

  // Multiple similar options
  if (stockPositions.length === 0 && allLong) {
    if (allCalls) return strategies.longCalls;
    if (allPuts) return strategies.longPuts;
  }
  if (stockPositions.length === 0 && allShort) {
    if (allCalls) return strategies.shortCalls;
    if (allPuts) return strategies.shortPuts;
  }

  // Default if no match found
  return strategies.custom;
}
