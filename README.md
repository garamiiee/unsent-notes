# 전하지 못한 진심

현실에서는 꺼내지 못했던 말을 안전한 디지털 공간에서 한 번 전해보는 인터랙티브 웹 서비스입니다.

실제 상대에게 메시지를 보내지 않고, 익숙한 앱 화면과 전달 연출을 통해 마음을 정리해볼 수 있습니다.

## Demo

서비스: [전하지 못한 진심](https://unsent-notes-six.vercel.app/)

소스 코드: [GitHub](https://github.com/garamiiee/unsent-notes)

## About the project

전달하고 싶은 마음은 있지만 현실에서는 쉽게 보내지 못하는 순간이 있습니다. 이 프로젝트는 그 말을 메신저, 이메일, 공문, 보고서 중 하나의 형식으로 작성하고 가상으로 전달하는 경험을 제공합니다.

전달 방식과 상대를 고른 뒤 메시지를 작성하면, 선택한 서비스에 맞는 화면과 애니메이션이 이어집니다. 마지막에는 상대의 말투를 반영한 가상 답장을 선택적으로 확인할 수 있습니다.

## Features

- 단계별 플로우: 전달 방식 → 상대 → 메시지 작성 → 전달 연출 → 완료
- 4가지 전달 방식: 사내 메신저, 이메일, 공문, 보고서
- 6가지 상대 유형: 상사, 교수님, 팀플 빌런 팀원, 클라이언트, 전 연인, 친구
- 실제 서비스를 참고한 작성 화면
  - 메신저: 채팅방과 말풍선
  - 이메일: 받는 사람, 보낸 사람, 제목, 본문
  - 공문: 수신·경유·제목·본문·직인
  - 보고서: 문서 도구 영역과 결재선
- 전달 방식별 전송 애니메이션
- 상대별 말투를 반영한 가상 답장
- 마음 보관함과 기록 삭제
- 데스크톱·모바일 반응형 레이아웃

## User flow

```text
전달 방식 선택
      ↓
상대 선택
      ↓
메시지 작성
      ↓
가상 전달 연출
      ↓
전달 완료 · 가상 답장
```

## Tech stack

| Category | Stack |
| --- | --- |
| Framework | Next.js, React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React `useState` |
| Storage | Browser `localStorage` |
| Deployment | Vercel |

## Getting started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
npm run build
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run Oxlint |
| `npm run format` | Format source files with Oxfmt |

## Data and privacy

- 실제 메시지는 어떤 상대에게도 발송되지 않습니다.
- 작성 기록은 현재 브라우저의 `localStorage`에만 저장됩니다.
- 브라우저 데이터를 삭제하거나 다른 기기에서 접속하면 기록을 볼 수 없습니다.
- 외부 서버나 외부 AI API를 사용하지 않고 상대별 가상 답장을 제공합니다.

## Design notes

전달 방식 선택 화면은 제품 사진과 여백을 중심으로 구성하고, 각 전달 방식은 실제 사용자가 익숙한 앱의 구조를 참고했습니다. 작성 화면에서는 서비스별 고유한 정보 구조를 유지하면서도 모든 메시지는 가상 전달임을 명확히 표시합니다.

## License

개인 프로젝트입니다.
