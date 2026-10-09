# Drone Bangladesh — Tailwind CSS project

আগের design ও layout রেখে storefront, admin panel, responsive rules, slider এবং invoice styling Tailwind CSS-এ convert করা হয়েছে। `frontend` ও `backend` আলাদা ফোল্ডারে আছে।

## Windows / VS Code

Node.js 20.9 বা তার পরের version ব্যবহার করুন। প্রথম terminal:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
```

`backend/.env`-এ নিজের MongoDB ও admin configuration দিন। এরপর:

```powershell
npm run dev
```

অন্য terminal:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

API: `http://localhost:5000/api/v1`। Website: `http://localhost:3000`। আগে থেকে `.env.local` সেট করা থাকলে সেটির configuration ব্যবহার করতে পারেন।

## Production build

প্রতিটি ফোল্ডারে:

```powershell
npm run build
npm run start
```

Frontend build-এর আগে `NEXT_PUBLIC_API_URL` আপনার API URL অনুযায়ী সেট করুন। বিস্তারিত configuration প্রতিটি ফোল্ডারের `README.md`-এ আছে।

## Styling files

- `frontend/app/globals.css`-এ শুধু Tailwind imports, config reference ও source নির্দেশনা আছে। এখানে কোনো design selector, layout declaration, custom variant বা keyframe নেই।
- প্রতিটি page/component-এর Tailwind utilities সেই `.tsx` file-এর `className` ও local `componentUtilities`-এ আছে। আগের global `tailwind-styles.ts` design map সরানো হয়েছে।
- আগের exact selector/state behavior রাখার জন্য Tailwind arbitrary variants ও values ব্যবহার করা হয়েছে।
- `utilities([priority, "Tailwind classes"])`-এর number শুধু build-এর cascade order রাখে। নতুন styling সংশ্লিষ্ট component-এর Tailwind string-এ লিখবেন।
- `frontend/scripts/component-cascade.cjs` component থেকে order metadata পড়ে। এটি কোনো selector বা design declaration তৈরি করে না; declarations Tailwind থেকে compile হয়।
- `frontend/tailwind.config.mjs` named animation definitions রাখে। Components-এর `animate-[...]` utility থেকে প্রয়োজনীয় keyframes generate হয়।
- `frontend/lib/tailwind.ts` CMS/API থেকে আসা runtime values-এর জন্য CSS variables সংযুক্ত করে। Fixed design styling component-এ থাকে।
- Invoice stylesheet `npm run styles:invoice` দিয়ে Tailwind থেকে generate হয়। `npm run dev` ও `npm run build` এটি স্বয়ংক্রিয়ভাবে চালায়।

PostCSS-এ Tailwind-এর আগাম minification বন্ধ রাখা হয়েছে, যাতে component priorities সাজানোর পর Next.js CSS minify করে। এতে development ও production-এ একই responsive design থাকে।

CMS-এর editable HTML/CSS এবং third-party chart/toast/cropper APIs চালু আছে।

Dependency ও build cache ZIP-এ রাখা হয়নি; `npm ci` দিয়ে dependencies install হবে। Validation-এর ফল `TAILWIND-VALIDATION.md`-এ আছে।
