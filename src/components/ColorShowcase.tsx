/**
 * Color Showcase Component
 * Demonstrates the healthcare color palette in action
 * Use this as a reference for component styling
 */

export default function ColorShowcase() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="bg-primary-700 text-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">LIMS Color Palette Showcase</h1>
          <p className="text-primary-100">
            Healthcare Professional Theme - Blue, White, & Red
          </p>
        </header>

        {/* Color Swatches */}
        <section className="card">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Color Palette
          </h2>

          {/* Primary Blue */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              Primary Blue - Trust & Professionalism
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="text-center">
                  <div
                    className={`h-20 rounded-md shadow-md mb-2 ${
                      shade <= 400 ? 'border border-neutral-300' : ''
                    }`}
                    style={{
                      backgroundColor: `var(--color-primary-${shade})`,
                    }}
                  />
                  <p className="text-xs font-medium text-neutral-700">
                    primary-{shade}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Accent Red */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              Accent Red - Urgency & Alerts
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="text-center">
                  <div
                    className={`h-20 rounded-md shadow-md mb-2 ${
                      shade <= 400 ? 'border border-neutral-300' : ''
                    }`}
                    style={{
                      backgroundColor: `var(--color-accent-${shade})`,
                    }}
                  />
                  <p className="text-xs font-medium text-neutral-700">
                    accent-{shade}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Neutrals */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              Neutral Gray - Clean & Professional
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="text-center">
                  <div
                    className={`h-20 rounded-md shadow-md mb-2 border ${
                      shade <= 200 ? 'border-neutral-400' : 'border-neutral-300'
                    }`}
                    style={{
                      backgroundColor: `var(--color-neutral-${shade})`,
                    }}
                  />
                  <p className="text-xs font-medium text-neutral-700">
                    neutral-{shade}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="card">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
            <button className="btn btn-accent">Danger Button</button>
            <button className="btn btn-success">Success Button</button>
            <button className="btn btn-warning">Warning Button</button>
            <button className="btn bg-neutral-600 text-white hover:bg-neutral-700 focus:ring-neutral-500">
              Neutral Button
            </button>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Cards</h2>

          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Standard Card
            </h3>
            <p className="text-neutral-600">
              This is a standard card with white background and subtle shadow.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-neutral-200 overflow-hidden">
            <div className="card-header">
              Card with Primary Header
            </div>
            <div className="p-6">
              <p className="text-neutral-600">
                This card has a primary blue header for emphasis.
              </p>
            </div>
          </div>

          <div className="bg-primary-50 rounded-lg shadow-md border border-primary-200 p-6">
            <h3 className="text-xl font-semibold text-primary-900 mb-2">
              Highlighted Card
            </h3>
            <p className="text-neutral-600">
              This card uses primary-50 background for subtle highlighting.
            </p>
          </div>
        </section>

        {/* Status Badges */}
        <section className="card">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Status Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="badge badge-success">Completed</span>
            <span className="badge badge-warning">Pending</span>
            <span className="badge badge-error">Cancelled</span>
            <span className="badge badge-info">In Progress</span>
            <span className="badge badge-primary">Active</span>
            <span className="badge bg-neutral-200 text-neutral-800">Inactive</span>
            <span className="badge bg-accent-600 text-white font-semibold">
              Urgent
            </span>
            <span className="badge bg-accent-900 text-white font-semibold">
              Critical
            </span>
          </div>
        </section>

        {/* Alerts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Alerts</h2>

          <div className="alert alert-success">
            <strong>Success!</strong> Your order has been created successfully.
          </div>

          <div className="alert alert-warning">
            <strong>Warning:</strong> Sample collection is due in 1 hour.
          </div>

          <div className="alert alert-error">
            <strong>Error:</strong> Failed to process payment. Please try again.
          </div>

          <div className="alert alert-info">
            <strong>Info:</strong> System maintenance scheduled for tonight.
          </div>
        </section>

        {/* Form Elements */}
        <section className="card">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Form Elements
          </h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Patient Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter patient name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Test Selection
              </label>
              <select className="input">
                <option>Select a test</option>
                <option>Complete Blood Count</option>
                <option>Lipid Profile</option>
                <option>Liver Function Test</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes (Error State)
              </label>
              <textarea
                className="input input-error"
                placeholder="This field has an error"
                rows={3}
              />
              <p className="mt-1 text-sm text-accent-700">
                This field is required
              </p>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="card p-0 overflow-hidden">
          <div className="card-header">Recent Orders</div>
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell">Order ID</th>
                <th className="table-cell">Patient</th>
                <th className="table-cell">Status</th>
                <th className="table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row">
                <td className="table-cell">ORD-2026-000001</td>
                <td className="table-cell">Raj Patel</td>
                <td className="table-cell">
                  <span className="badge badge-success">Completed</span>
                </td>
                <td className="table-cell">Oct 8, 2026</td>
              </tr>
              <tr className="table-row">
                <td className="table-cell">ORD-2026-000002</td>
                <td className="table-cell">Priya Singh</td>
                <td className="table-cell">
                  <span className="badge badge-warning">Pending</span>
                </td>
                <td className="table-cell">Oct 8, 2026</td>
              </tr>
              <tr className="table-row">
                <td className="table-cell">ORD-2026-000003</td>
                <td className="table-cell">Ahmed Khan</td>
                <td className="table-cell">
                  <span className="badge badge-info">In Progress</span>
                </td>
                <td className="table-cell">Oct 7, 2026</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Sidebar Demo */}
        <section className="flex gap-6 h-96">
          <aside className="sidebar flex-shrink-0">
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4">Navigation</h3>
              <nav className="space-y-1">
                <div className="sidebar-item sidebar-item-active">
                  Dashboard
                </div>
                <div className="sidebar-item">Orders</div>
                <div className="sidebar-item">Patients</div>
                <div className="sidebar-item">Reports</div>
                <div className="sidebar-item">Settings</div>
              </nav>
            </div>
          </aside>

          <div className="flex-1 card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Main Content Area
            </h3>
            <p className="text-neutral-600 mb-4">
              This demonstrates the sidebar with navigation items. The active item
              has a red accent border.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                <div className="text-3xl font-bold text-primary-700">142</div>
                <div className="text-sm text-neutral-600">Total Orders</div>
              </div>
              <div className="bg-success-50 p-4 rounded-lg border border-success-200">
                <div className="text-3xl font-bold text-success-700">98</div>
                <div className="text-sm text-neutral-600">Completed</div>
              </div>
              <div className="bg-warning-50 p-4 rounded-lg border border-warning-200">
                <div className="text-3xl font-bold text-warning-700">44</div>
                <div className="text-sm text-neutral-600">Pending</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
