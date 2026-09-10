"use client";

import { LoginScreen } from "@/components/LoginScreen";

/**
 * 로그인 화면은 이제 첫 화면(/)이다.
 *
 * 저장해 둔 링크나 예전 주소가 막히지 않도록 이 경로도 같은 화면을 보여 준다.
 * 다른 곳으로 보내는 대신 그냥 같은 것을 그린다. 주소만 두 개일 뿐 화면은 하나다.
 */
export default function LoginPage() {
  return <LoginScreen />;
}
