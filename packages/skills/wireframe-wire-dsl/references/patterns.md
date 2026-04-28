# wire-dsl patterns

Copy-adapt these for common briefs. Each is a complete, valid `project { ... }` you can render with `wire render`.

## 1. Single-screen form

```wire
project "Signup" {
  style {
    density: "normal"
    spacing: "md"
    radius: "md"
    stroke: "normal"
    font: "base"
  }

  screen Signup {
    layout stack(direction: vertical, gap: lg, padding: xl) {
      component Heading text: "Create your account" level: 2
      component Text text: "Fill in the fields below to get started." variant: muted

      layout panel(padding: lg, radius: md) {
        layout stack(direction: vertical, gap: md, padding: none) {
          component Input label: "Full name" placeholder: "Jane Doe"
          component Input label: "Email" placeholder: "you@example.com"
          component Input label: "Password" placeholder: "••••••••"
          component Checkbox label: "Subscribe to product updates" checked: false
        }
      }

      layout stack(direction: horizontal, gap: sm, padding: none, justify: end) {
        component Button text: "Cancel"
        component Button text: "Create account" variant: primary onClick: navigate(Welcome)
      }
    }
  }

  screen Welcome {
    layout stack(direction: vertical, gap: md, padding: xl) {
      component Heading text: "You're in 🎉" level: 1
      component Text text: "Check your inbox for a verification link."
    }
  }
}
```

## 2. KPI dashboard with chart + table

```wire
project "Analytics" {
  style { density: "comfortable" spacing: "lg" radius: "md" stroke: "normal" font: "base" }

  screen Dashboard {
    layout stack(direction: vertical, gap: lg, padding: xl) {
      component Topbar title: "Analytics"

      layout grid(columns: 12, gap: lg) {
        cell span: 4 { layout card(padding: md, gap: sm) {
          component Heading text: "Users" level: 4
          component Stat title: "Total" value: "12,438" delta: "+4.2%"
        } }
        cell span: 4 { layout card(padding: md, gap: sm) {
          component Heading text: "Revenue" level: 4
          component Stat title: "MRR" value: "$48.1K" delta: "+8.1%"
        } }
        cell span: 4 { layout card(padding: md, gap: sm) {
          component Heading text: "Churn" level: 4
          component Stat title: "30d" value: "1.6%" delta: "-0.3%"
        } }
      }

      layout card(padding: lg, gap: md) {
        component Heading text: "Signups (last 30 days)" level: 3
        component Chart type: "line" height: 280
      }

      layout card(padding: lg, gap: md) {
        component Heading text: "Recent activity" level: 3
        component Table columns: "Date,User,Event,Status" rows: 8
      }
    }
  }
}
```

## 3. Sidebar app shell + detail screen

```wire
project "AdminApp" {
  style { density: "normal" spacing: "md" radius: "md" stroke: "normal" font: "base" }

  screen UsersList {
    layout split(left: 240) {
      component SidebarMenu items: "Users,Roles,Permissions,Audit,Settings" active: "Users"
      layout stack(direction: vertical, gap: md, padding: lg) {
        component Topbar title: "Users"
        layout stack(direction: horizontal, gap: sm, padding: none, justify: spaceBetween) {
          component Input placeholder: "Search users…"
          component Button text: "Create user" variant: primary onClick: navigate(UserCreate)
        }
        component Table columns: "Name,Email,Role,Status" rows: 10
      }
    }
  }

  screen UserCreate {
    layout stack(direction: vertical, gap: md, padding: lg) {
      component Breadcrumbs items: "Users,New"
      layout panel(padding: lg) {
        layout stack(direction: vertical, gap: md, padding: none) {
          component Input label: "First name"
          component Input label: "Last name"
          component Input label: "Email"
          component Select label: "Role" options: "Admin,Editor,Viewer"
        }
      }
      layout stack(direction: horizontal, gap: sm, padding: none, justify: end) {
        component Button text: "Cancel" onClick: navigate(UsersList)
        component Button text: "Create" variant: primary
      }
    }
  }
}
```

## 4. Modal trigger + confirm dialog

```wire
project "DeleteFlow" {
  style { density: "normal" spacing: "md" radius: "md" stroke: "normal" font: "base" }

  screen Files {
    layout stack(direction: vertical, gap: md, padding: lg) {
      component Heading text: "Files"
      component Table columns: "Name,Size,Modified" rows: 5
      component Button text: "Delete selected" variant: danger onClick: show(confirm_delete)

      layout modal(padding: lg) {
        body {
          component Heading text: "Delete 3 files?" level: 3
          component Text text: "This action can't be undone." variant: muted
        }
        footer {
          component Button text: "Cancel" onClick: hide(confirm_delete)
          component Button text: "Delete" variant: danger
        }
      }
    }
  }
}
```

## 5. Tabs (workaround — render only the active body)

The wire-dsl 0.0.1 renderer can't draw multi-tab bodies (see [dsl-cheatsheet.md → Tabs caveat](dsl-cheatsheet.md)). For wireframes, render the tab strip as a `component Tabs` for visual reference, then show **only the active tab's body** inline below it. For viewing other tab bodies, define them as separate screens linked by `navigate(...)`.

```wire
project "Settings" {
  style { density: "normal" spacing: "md" radius: "md" stroke: "normal" font: "base" }

  screen SettingsProfile {
    layout stack(direction: vertical, gap: md, padding: lg) {
      component Heading text: "Settings"
      component Tabs tabs: "Profile,Account,Billing" active: "Profile"
      layout panel(padding: md) {
        layout stack(direction: vertical, gap: md, padding: none) {
          component Input label: "Display name"
          component Textarea label: "Bio" rows: 4
          component Button text: "Save" variant: primary
        }
      }
      layout stack(direction: horizontal, gap: sm, padding: none) {
        component Link text: "View Account tab" onClick: navigate(SettingsAccount)
        component Link text: "View Billing tab" onClick: navigate(SettingsBilling)
      }
    }
  }

  screen SettingsAccount {
    layout stack(direction: vertical, gap: md, padding: lg) {
      component Heading text: "Settings"
      component Tabs tabs: "Profile,Account,Billing" active: "Account"
      layout panel(padding: md) {
        layout stack(direction: vertical, gap: md, padding: none) {
          component Input label: "Email"
          component Toggle label: "Two-factor auth" checked: true
        }
      }
    }
  }

  screen SettingsBilling {
    layout stack(direction: vertical, gap: md, padding: lg) {
      component Heading text: "Settings"
      component Tabs tabs: "Profile,Account,Billing" active: "Billing"
      layout panel(padding: md) {
        layout stack(direction: vertical, gap: md, padding: none) {
          component Stat title: "Plan" value: "Pro"
          component Button text: "Manage subscription" variant: primary
        }
      }
    }
  }
}
```

## 6. App shell reused across many screens (`define Layout`)

For 3+ screens that share sidebar + topbar chrome, declare it once and invoke per screen with different `active` and `Children`. Skips the boilerplate and keeps the menu state correct.

> **Single-child slot.** `component Children` accepts **exactly one** child node per invocation. Wrap each screen's body in a single root layout (typically `stack`) — passing multiple direct children will produce `[layout-children-arity] Layout "X" expects exactly one child` at render time even though `wire validate` accepts it.

```wire
project "Admin" {
  style { density: "normal" spacing: "md" radius: "md" stroke: "normal" font: "base" }

  define Layout "AppShell" {
    layout split(left: prop_width) {
      component SidebarMenu items: prop_items active: prop_active
      component Children
    }
  }

  screen Dashboard {
    layout AppShell(width: 240, items: "Dashboard,Users,Reports,Settings", active: "Dashboard") {
      layout stack(direction: vertical, gap: md, padding: lg) {
        component Topbar title: "Dashboard"
        layout grid(columns: 12, gap: md) {
          cell span: 4 { layout card(padding: md, gap: sm) {
            component Stat title: "Users" value: "12,438" delta: "+4.2%"
          } }
          cell span: 4 { layout card(padding: md, gap: sm) {
            component Stat title: "MRR" value: "$48.1K" delta: "+8.1%"
          } }
          cell span: 4 { layout card(padding: md, gap: sm) {
            component Stat title: "Churn" value: "1.6%" delta: "-0.3%"
          } }
        }
        component Chart type: "line" height: 280
      }
    }
  }

  screen Users {
    layout AppShell(width: 240, items: "Dashboard,Users,Reports,Settings", active: "Users") {
      layout stack(direction: vertical, gap: md, padding: lg) {
        component Topbar title: "Users"
        component Table columns: "Name,Email,Role,Status" rows: 10
      }
    }
  }

  screen Reports {
    layout AppShell(width: 240, items: "Dashboard,Users,Reports,Settings", active: "Reports") {
      layout stack(direction: vertical, gap: md, padding: lg) {
        component Topbar title: "Reports"
        component Table columns: "Name,Owner,Run,Status" rows: 8
      }
    }
  }
}
```

The `prop_active` value flows through to the `SidebarMenu`'s `active` prop, so each screen highlights its own item. Notice that the inner `layout stack(...)` (not the components themselves) is the single child of `AppShell` — that's how multi-element screens fit through the slot.

## 7. Branching wizard (multi-step flow with conditional paths)

For onboarding / setup flows with conditional branches, model each step as a screen and use `navigate(...)` to fan out and converge. Show "Step N of M" as plain text per screen.

```wire
project "Onboarding" {
  style { density: "normal" spacing: "md" radius: "md" stroke: "normal" font: "base" }

  screen Welcome {
    layout stack(direction: vertical, gap: lg, padding: xl, align: center) {
      component Heading text: "Welcome to Acme"
      component Text text: "Let's set up your workspace." variant: muted
      component Button text: "Get started" variant: primary onClick: navigate(AccountType)
    }
  }

  screen AccountType {
    layout stack(direction: vertical, gap: md, padding: xl) {
      component Text text: "Step 1 of 3" variant: muted
      component Heading text: "Pick your account type"
      layout stack(direction: horizontal, gap: md, padding: none) {
        layout card(padding: lg, gap: sm) {
          component Heading text: "Personal" level: 4
          component Text text: "For individuals and side projects." variant: muted
          component Button text: "Continue as Personal" variant: secondary onClick: navigate(ProfilePersonal)
        }
        layout card(padding: lg, gap: sm) {
          component Heading text: "Business" level: 4
          component Text text: "For teams and companies." variant: muted
          component Button text: "Continue as Business" variant: primary onClick: navigate(ProfileBusiness)
        }
      }
    }
  }

  screen ProfilePersonal {
    layout stack(direction: vertical, gap: md, padding: xl) {
      component Text text: "Step 2 of 3" variant: muted
      component Heading text: "Tell us about you"
      component Input label: "Display name" placeholder: "Jane Doe"
      component Input label: "Date of birth" placeholder: "MM/DD/YYYY"
      layout stack(direction: horizontal, gap: sm, padding: none, justify: end) {
        component Button text: "Back" onClick: navigate(AccountType)
        component Button text: "Continue" variant: primary onClick: navigate(Confirm)
      }
    }
  }

  screen ProfileBusiness {
    layout stack(direction: vertical, gap: md, padding: xl) {
      component Text text: "Step 2 of 3" variant: muted
      component Heading text: "Tell us about your business"
      component Input label: "Company name"
      component Select label: "Team size" options: "1-10,11-50,51-200,200+"
      component Select label: "Industry" options: "SaaS,Retail,Finance,Other"
      layout stack(direction: horizontal, gap: sm, padding: none, justify: end) {
        component Button text: "Back" onClick: navigate(AccountType)
        component Button text: "Continue" variant: primary onClick: navigate(Confirm)
      }
    }
  }

  screen Confirm {
    layout stack(direction: vertical, gap: md, padding: xl) {
      component Text text: "Step 3 of 3" variant: muted
      component Heading text: "Review and confirm"
      layout panel(padding: lg) {
        component Text text: "Your details look good." variant: muted
      }
      layout stack(direction: horizontal, gap: sm, padding: none, justify: end) {
        component Link text: "Edit" onClick: navigate(AccountType)
        component Button text: "Confirm" variant: primary onClick: navigate(Done)
      }
    }
  }

  screen Done {
    layout stack(direction: vertical, gap: md, padding: xl, align: center) {
      component Heading text: "You're all set 🎉"
      component Text text: "Welcome to Acme." variant: muted
    }
  }
}
```

`navigate(...)` resolves forward references — declaring `Done` last works fine even though earlier screens reference it.
