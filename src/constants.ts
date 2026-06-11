import type {Orientation, Platform} from './types';

export const STORAGE_BUCKET = 'uiux-screenshots';
export const PAGE_SIZE = 40;

export const DEFAULT_FEATURES = [
  '로그인',
  '타이틀',
  '로비',
  '메인 메뉴',
  '매칭',
  '포지션/캐릭터 선택',
  '인게임 HUD',
  '결과 화면',
  '보상 화면',
  '캐릭터/선수',
  '캐릭터 상세',
  '성장/강화',
  '스킬/장비',
  '샵',
  '상품 상세',
  '구매 확인',
  '이벤트',
  '출석',
  '미션',
  '시즌패스',
  '랭킹',
  '친구/소셜',
  '우편함',
  '설정',
  '팝업/알림',
  '튜토리얼',
];

export const PLATFORMS: Platform[] = ['Mobile', 'PC', 'Console', 'Cross-platform'];
export const ORIENTATIONS: Orientation[] = ['Landscape', 'Portrait'];

export const EDIT_UNLOCK_KEY = 'uiux-reference-edit-unlocked';
export const LAST_FEATURE_KEY = 'uiux-reference-last-feature';
