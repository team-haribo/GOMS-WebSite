export interface ApplyRole {
  label: string; // "iOS" | "Android" | "Backend" | "Flutter" | "DevOps" | "Design"
  slug: string; // lowercase slug used in URL
  color: string;
  bg: string;
  title: string; // big title on detail page
  subtitle: string; // one-liner
  intro: string; // detail paragraph
  stack: string[];
  talents: { title: string; desc: string }[]; // "인재상"
}

export const APPLY_ROLES: ApplyRole[] = [
  {
    label: "iOS",
    slug: "ios",
    color: "#F5A623",
    bg: "from-orange-50 to-amber-50",
    title: "iOS Developer",
    subtitle: "Swift로 Apple 생태계의 앱을 만들어요.",
    intro:
      "UIKit·SwiftUI·Combine으로 사용자가 오래 쓰고 싶어지는 앱을 만들어요. 디테일과 애니메이션, 그리고 새로운 기술 도입에 열려 있는 사람을 찾고 있어요.",
    stack: ["Swift", "UIKit", "SwiftUI", "Combine"],
    talents: [
      {
        title: "Swift에 대한 호기심",
        desc: "Swift 문법과 Apple의 API에 흥미가 있고, 공식 문서를 읽는 걸 두려워하지 않아요.",
      },
      {
        title: "사용자 경험에 대한 집착",
        desc: "버튼 하나, 애니메이션 하나, 트랜지션 하나에 '왜 이렇게 동작해야 하는지' 고민하는 사람.",
      },
      {
        title: "새로운 기술에 대한 열린 마음",
        desc: "UIKit에서 SwiftUI로, Combine에서 async/await로, 변화를 기회로 보는 사람.",
      },
    ],
  },
  {
    label: "Android",
    slug: "android",
    color: "#3B82F6",
    bg: "from-blue-50 to-indigo-50",
    title: "Android Developer",
    subtitle: "Kotlin과 Compose로 안드로이드 앱을 만들어요.",
    intro:
      "Jetpack Compose·Coroutines·Flow로 모던한 안드로이드 앱을 만들어요. Material Design을 존중하면서도 GOMS만의 개성을 녹여낼 줄 아는 사람을 찾아요.",
    stack: ["Kotlin", "Jetpack Compose", "Coroutines", "Flow"],
    talents: [
      {
        title: "Kotlin에 대한 애정",
        desc: "Java에서 Kotlin으로 넘어오는 과정 자체가 재미있는 사람. 확장 함수나 코루틴이 예뻐 보이는 사람.",
      },
      {
        title: "Compose·Material Design 이해",
        desc: "선언형 UI의 장점을 이해하고, Material Design 가이드와 디자인 시스템을 존중하는 사람.",
      },
      {
        title: "새로운 기술 도입에 적극적",
        desc: "매년 쏟아지는 Jetpack 라이브러리를 따라가고, 팀에 공유하는 걸 즐기는 사람.",
      },
    ],
  },
  {
    label: "Backend",
    slug: "backend",
    color: "#10B981",
    bg: "from-emerald-50 to-teal-50",
    title: "Backend Developer",
    subtitle: "Spring Boot로 서버와 API를 설계해요.",
    intro:
      "Kotlin·Spring Boot·JPA로 안정적인 REST API와 데이터베이스, 푸시 알림 시스템을 만들어요. 데이터의 흐름과 구조를 깊이 고민하는 사람을 찾아요.",
    stack: ["Kotlin", "Spring Boot", "JPA", "MySQL"],
    talents: [
      {
        title: "데이터 흐름에 대한 감각",
        desc: "요청이 들어와서 응답이 나가기까지, 각 계층에서 무슨 일이 일어나는지 머릿속에 그릴 수 있는 사람.",
      },
      {
        title: "견고한 설계에 대한 욕심",
        desc: "당장 돌아가는 코드보다, 6개월 뒤에도 유지보수하기 쉬운 구조를 고민하는 사람.",
      },
      {
        title: "문제 해결 능력",
        desc: "버그가 발생했을 때 당황하지 않고, 로그와 스택 트레이스에서 단서를 찾는 사람.",
      },
    ],
  },
  {
    label: "Flutter",
    slug: "flutter",
    color: "#06B6D4",
    bg: "from-cyan-50 to-sky-50",
    title: "Flutter Developer",
    subtitle: "Dart로 iOS와 Android를 한 번에 만들어요.",
    intro:
      "Flutter·Riverpod·Dio로 크로스 플랫폼 앱을 빠르게 만들어요. 하나의 코드베이스로 여러 플랫폼을 다루는 재미를 아는 사람을 찾아요.",
    stack: ["Dart", "Flutter", "Riverpod", "Dio"],
    talents: [
      {
        title: "크로스 플랫폼에 대한 관심",
        desc: "iOS와 Android를 따로 만드는 것보다 하나로 만들고 싶은 이유가 명확한 사람.",
      },
      {
        title: "위젯 트리 이해",
        desc: "Flutter의 위젯 철학과 상태 관리 흐름을 이해하고, 직접 구조를 설계해보고 싶은 사람.",
      },
      {
        title: "빠른 프로토타이핑 마인드",
        desc: "'일단 만들어 보자'와 '설계를 먼저 하자' 사이의 균형을 잡을 줄 아는 사람.",
      },
    ],
  },
  {
    label: "DevOps",
    slug: "devops",
    color: "#8B5CF6",
    bg: "from-violet-50 to-purple-50",
    title: "DevOps Engineer",
    subtitle: "배포와 인프라를 자동화해요.",
    intro:
      "Docker·GitHub Actions·AWS로 CI/CD 파이프라인과 서버 인프라를 관리해요. 서비스가 새벽에도 안정적으로 돌아가도록 책임지는 사람을 찾아요.",
    stack: ["Docker", "GitHub Actions", "AWS", "Linux"],
    talents: [
      {
        title: "자동화에 대한 집착",
        desc: "같은 작업을 두 번 하느니 자동화 스크립트를 짜는 게 재밌는 사람.",
      },
      {
        title: "안정성에 대한 책임감",
        desc: "'서비스가 멈추면 안 된다'는 마음가짐으로, 장애 대응과 모니터링을 중요하게 생각하는 사람.",
      },
      {
        title: "네트워크·리눅스 기초",
        desc: "SSH, Docker, nginx, 기본적인 리눅스 명령어와 친한 사람. 아니면 친해지고 싶은 사람.",
      },
    ],
  },
  {
    label: "Design",
    slug: "design",
    color: "#EC4899",
    bg: "from-pink-50 to-rose-50",
    title: "UI/UX Designer",
    subtitle: "Figma로 서비스의 얼굴을 만들어요.",
    intro:
      "Figma로 와이어프레임, 프로토타입, 디자인 시스템을 만들어요. 사용자의 관점에서 생각하고, 개발자와 함께 디테일을 맞춰가는 사람을 찾아요.",
    stack: ["Figma", "Design System", "Prototype"],
    talents: [
      {
        title: "사용자 관점에서 생각하는 힘",
        desc: "'이 버튼을 처음 보는 사람은 어떻게 느낄까?'를 먼저 떠올리는 사람.",
      },
      {
        title: "디자인 시스템에 대한 이해",
        desc: "반복되는 요소에서 규칙을 찾고, 일관된 시스템을 만드는 걸 즐기는 사람.",
      },
      {
        title: "개발자와의 협업",
        desc: "개발이 가능한 디자인과 불가능한 디자인의 차이를 이해하고, 함께 절충점을 찾는 사람.",
      },
    ],
  },
];

export function getRoleBySlug(slug: string): ApplyRole | undefined {
  return APPLY_ROLES.find((r) => r.slug === slug.toLowerCase());
}
