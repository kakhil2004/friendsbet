import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-gray-400 hover:text-gray-200 text-sm mb-6 inline-block"
      >
        &larr; Back
      </Link>

      <h1 className="text-3xl font-bold text-gray-100 mb-8">How It Works</h1>

      {/* Parimutuel basics */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          Parimutuel Betting
        </h2>
        <p className="text-gray-400 leading-relaxed">
          FriendBets uses a <span className="text-gray-200 font-medium">parimutuel</span> system.
          All bets on a market go into a shared pool. When the market resolves, the entire pool
          is split among the winners proportional to how much they bet. There is no house cut —
          all coins go to the winners.
        </p>
      </section>

      {/* Odds */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          How Odds Work
        </h2>
        <p className="text-gray-400 leading-relaxed mb-3">
          The displayed percentages reflect the proportion of coins on each side:
        </p>
        <div className="bg-gray-800 rounded-md p-4 font-mono text-sm text-gray-300 mb-3">
          <p>yesOdds = yesPool / totalPool</p>
          <p>noOdds = noPool / totalPool</p>
        </div>
        <p className="text-gray-400 leading-relaxed">
          For example, if 700 coins are on YES and 300 on NO, the odds show 70% YES / 30% NO.
          This means YES bettors would need to share more of the pool, while NO bettors get a
          bigger share if they win.
        </p>
      </section>

      {/* Potential payout */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          Potential Payout (Before Resolution)
        </h2>
        <p className="text-gray-400 leading-relaxed mb-3">
          When you&apos;re about to place a bet, the potential payout is estimated as:
        </p>
        <div className="bg-gray-800 rounded-md p-4 font-mono text-sm text-gray-300 mb-3">
          payout = betAmount × (totalPool + betAmount) / (outcomePool + betAmount)
        </div>
        <p className="text-gray-400 leading-relaxed">
          This accounts for your bet being added to the pool. The actual payout may differ if
          more bets are placed after yours before the market resolves.
        </p>
      </section>

      {/* Resolution payout */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          Resolution Payout
        </h2>
        <p className="text-gray-400 leading-relaxed mb-3">
          When a market is resolved, winners receive:
        </p>
        <div className="bg-gray-800 rounded-md p-4 font-mono text-sm text-gray-300 mb-3">
          payout = (yourBet / winningPool) × totalPool
        </div>
        <p className="text-gray-400 leading-relaxed">
          Your share of the winnings is proportional to how much of the winning side you represent.
          If you bet 100 out of a 500-coin winning pool and the total pool is 1000, you receive
          100/500 × 1000 = 200 coins.
        </p>
      </section>

      {/* Underdog bonus */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          Underdog Bonus
        </h2>
        <p className="text-gray-400 leading-relaxed mb-3">
          When you bet on the side with fewer coins (the underdog), the house adds free bonus
          coins to the pool on top of your bet. This makes underdog positions more attractive.
        </p>
        <div className="bg-gray-800 rounded-md p-4 font-mono text-sm text-gray-300 mb-3">
          bonusPercent = min(25%, (majorityPercent - 50) × 0.5)
        </div>
        <div className="mt-3">
          <p className="text-gray-400 text-sm font-medium mb-2">Examples:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-400">50/50 pool</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-300">0% bonus</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-400">70/30 pool</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-300">10% bonus</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-400">80/20 pool</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-300">15% bonus</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-400">90/10 pool</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-300">20% bonus</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-400">100/0 pool</div>
            <div className="bg-gray-800 rounded px-3 py-2 text-gray-300">25% bonus (max)</div>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed mt-3">
          The bonus coins are added as a &quot;house&quot; bet on your side. They increase the total pool
          but aren&apos;t deducted from anyone&apos;s balance. When the market resolves, house bonus
          coins stay in the pool for winners but the house doesn&apos;t collect any payout.
        </p>
      </section>

      {/* No house cut */}
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-3">
          No House Cut
        </h2>
        <p className="text-gray-400 leading-relaxed">
          FriendBets takes zero commission. 100% of the pool goes to the winners.
          The only &quot;house&quot; involvement is adding underdog bonus coins, which are free
          coins that benefit the winners.
        </p>
      </section>
    </div>
  );
}
