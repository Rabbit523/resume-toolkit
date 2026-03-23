import { redirect  } from 'next/navigation';
import Client from './client';

async function getProfile(slug) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_DOMAIN}/api/profiles/public/${slug}`,
    { cache: 'no-store' } // always fresh
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function ProfilePage({ params }) {
  const profiles = await getProfile(params.slug);

  if (!profiles) redirect('/404');

  return <Client profiles={profiles} />;
}
