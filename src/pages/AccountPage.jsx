function AccountPage({ isSignedIn, onSignIn, onSignOut }) {
  return (
    <section className="page narrow">
      <h1>Account</h1>
      <p className="page-subtitle">
        Use this demo account toggle to simulate a signed-in checkout experience.
      </p>

      <div className="empty-state">
        <p>
          Status:{' '}
          <strong>{isSignedIn ? 'Signed in as shopper@novastore.com' : 'Signed out'}</strong>
        </p>
        <div className="details-actions">
          {isSignedIn ? (
            <button className="button secondary" onClick={onSignOut}>
              Sign Out
            </button>
          ) : (
            <button className="button" onClick={onSignIn}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default AccountPage
