/**
 * 서버·스크립트용 문항 뱅크 주입.
 *
 * 이 파일을 import 하는 순간 뱅크가 준비된다. 브라우저 코드에서는 쓰지 않는다
 * (6MB 가 번들에 들어간다). 브라우저는 bank-browser.ts 를 쓴다.
 */
import testletData from "@/data/testlets.json";
import { setBank, type Testlet } from "./repository";

setBank(testletData as unknown as Testlet[]);

export {};
