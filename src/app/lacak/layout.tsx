import { LacakTransitionProvider } from "@/components/lacak/LacakTransitionContext";

export default function LacakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LacakTransitionProvider>{children}</LacakTransitionProvider>;
}

