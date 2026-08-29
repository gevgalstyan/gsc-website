/** Lightweight route skeleton while private member data is loading. */

export default function AccountLoading() {
  return <main className="dashboard-shell" aria-busy="true" aria-label="Loading your member space">
    <div className="dashboard-content account-loading-shell">
      <div className="member-skeleton member-skeleton-welcome" />
      <div className="member-skeleton-grid">{Array.from({ length: 4 }, (_, index) => <div className="member-skeleton" key={index} />)}</div>
      <div className="member-skeleton-grid member-skeleton-grid-wide">{Array.from({ length: 4 }, (_, index) => <div className="member-skeleton" key={index} />)}</div>
    </div>
  </main>;
}
