# ✨ Astro Boilerplate

## 📖 Introduction

This is an Astro boilerplate created using **Astro** as the JavaScript framework and **Bun** as the package manager. It includes built-in authentication and middleware powered by the **Lucia** library, along with **DrizzleORM** as the database management system.

## 🚀 Installation

You can install this project by either downloading it as a ZIP file or cloning it from the Git repository:

```bash
git clone https://github.com/nifnip22/My-Astro-Boilerplate.git
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                         | Action                                           |
| :------------------------------ | :----------------------------------------------- |
| `bun install`                   | Installs dependencies                            |
| `bun --bun run dev`             | Starts local dev server at `localhost:4321`      |
| `bun --bun run build`           | Build your production site to `./dist/`          |
| `bun --bun run preview`         | Preview your build locally, before deploying     |
| `bun --bun run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun --bun run astro -- --help` | Get help using the Astro CLI                     |

## 📂 Project Structure

Inside of this Astro boilerplate, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── middleware.ts
│   └── components/
│   └── layouts/
│   └── icons/
│   └── lib/
│   │   └── auth.ts
│   │   └── db.ts
│   └── pages/
│       └── api/
│       └── auth/
│       │   └── login/
│       │   └── register/
│       └── dashboard/
│       └── profile/
│       └── index.astro
└── package.json
```

## 🔐 Authentication & Middleware

This project uses **Lucia** for authentication. Lucia provides a robust and flexible solution, allowing you to easily implement features such as user registration, login, and session management. In addition, **Lucia** comes with built-in middleware to secure routes and handle authentication seamlessly. For more details, check the official documentation: [Lucia Auth](https://lucia-auth.com/).

## 🛢️ Database

By default, this project uses MySQL with mysql2 as the client for Node.js as its database with the **DrizzleORM** driver. If you wish to change the database configuration, you can refer to the official [Lucia Database Documentation](https://lucia-auth.com/database/drizzle) & [DrizzleORM Documentation](https://orm.drizzle.team/docs/overview) for guidance.
