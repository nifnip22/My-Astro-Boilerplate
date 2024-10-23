# ✨ Astro Boilerplate

## 📖 Introduction

This is an Astro boilerplate created using **Astro** as the JavaScript framework and **Bun** as the package manager. It includes built-in authentication and middleware powered by the **Lucia** library, along with **DrizzleORM** as the database management system, and comes pre-installed with **TailwindCSS** for utility-first styling and **React** that already installed if you want to build interactive UIs.

## 🚀 Installation

You can install this project by either downloading it as a ZIP file or cloning it from the Git repository:

```bash
git clone https://github.com/nifnip22/My-Astro-Boilerplate.git

cd My-Astro-Boilerplate
```

After cloning the repository, you need to set up your environment variables. Copy the example environment file:

```bash
cp .env.example .env
```

Open the **.env** file in a text editor and fill in the required values:

- **`SMTP_HOST`**: The SMTP server address (e.g., `smtp.gmail.com`).
- **`SMTP_USER`**: Your email address used for authentication.
- **`SMTP_APP_PASSWORD`**: Your app password for SMTP authentication.
- **`SMTP_PORT`**: The port number for the SMTP server (usually `465` for SSL).

Don't forget to setup the database in your MySQL Server. If you want to use another driver, check the **Database Section** below

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                         | Action                                           |
| :------------------------------ | :----------------------------------------------- |
| `bun install`                   | Install all dependencies                            |
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

By default, this project uses MySQL with mysql2 as the client for Node.js as its database with the **DrizzleORM** driver. To configure the database, follow these steps:

1. Open the `db.ts` file in the `src/lib` directory.
2. Update the database configuration as needed, referring to the official [Lucia Database Documentation](https://lucia-auth.com/sessions/basic-api/) & [DrizzleORM Documentation](https://orm.drizzle.team/docs/overview) for guidance.

Note: Make sure to update the database configuration in the `db.ts` file to match your desired database setup.

## 🤝 Contributing

If you'd like to contribute to this project, please fork the repository and submit a pull request. Make sure to follow the contribution guidelines.
