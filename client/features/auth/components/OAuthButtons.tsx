"use client";

import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { Button } from "@/design-system";
import { getOAuthProviders, getOAuthUrl, type OAuthProviderName, type OAuthProviders } from "@/data/api/auth";
import { beginOAuthFlow } from "@/data/oauthFlow";

const labels: Record<OAuthProviderName, string> = { google: "Google", github: "GitHub" };

type Props = {
  disabled?: boolean;
  returnTo?: string;
  onBusy?: (busy: boolean) => void;
  onError: (message: string) => void;
};

/** Shows only the providers this deployment has configured, so nobody clicks a button that cannot work. */
export function OAuthButtons({ disabled, returnTo, onBusy, onError }: Props) {
  const [providers, setProviders] = useState<OAuthProviders | null>(null);
  const [opening, setOpening] = useState<OAuthProviderName | null>(null);

  useEffect(() => {
    let active = true;
    getOAuthProviders()
      .then((value) => { if (active) setProviders(value); })
      .catch(() => { if (active) setProviders({ google: false, github: false }); });
    return () => { active = false; };
  }, []);

  async function start(provider: OAuthProviderName) {
    setOpening(provider);
    onBusy?.(true);
    onError("");
    try {
      const { url } = await getOAuthUrl(provider, beginOAuthFlow("login", returnTo));
      window.location.assign(url);
    } catch (error) {
      onError(error instanceof Error ? error.message : `${labels[provider]} sign-in is not available right now.`);
      setOpening(null);
      onBusy?.(false);
    }
  }

  const available = (Object.keys(labels) as OAuthProviderName[]).filter((provider) => providers?.[provider]);
  if (providers && !available.length) return null;

  return (
    <div className="space-y-3" aria-busy={!providers}>
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />or continue with<span className="h-px flex-1 bg-line" />
      </div>
      <div className={available.length > 1 || !providers ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
        {(providers ? available : (["google", "github"] as OAuthProviderName[])).map((provider) => (
          <Button key={provider} type="button" variant="secondary" className="w-full" disabled={!providers || disabled || opening !== null} onClick={() => void start(provider)}>
            {provider === "github" ? <Github size={16} aria-hidden="true" /> : <span className="font-semibold" aria-hidden="true">G</span>}
            {opening === provider ? `Opening ${labels[provider]}…` : labels[provider]}
          </Button>
        ))}
      </div>
    </div>
  );
}
