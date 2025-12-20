import { Shot, ProjectState, Keyframe } from '../../types';
import { VISUAL_STYLE_PROMPTS, VIDEO_PROMPT_TEMPLATES } from './constants';
import { getCameraMovementCompositionGuide } from './cameraMovementGuides';

/**
 * 获取镜头的参考图片
 */
export const getRefImagesForShot = (shot: Shot, scriptData: ProjectState['scriptData']): string[] => {
  const referenceImages: string[] = [];
  
  if (!scriptData) return referenceImages;
  
  // 1. 场景参考图（环境/氛围） - 优先级最高
  const scene = scriptData.scenes.find(s => String(s.id) === String(shot.sceneId));
  if (scene?.referenceImage) {
    referenceImages.push(scene.referenceImage);
  }

  // 2. 角色参考图（外观）
  if (shot.characters) {
    shot.characters.forEach(charId => {
      const char = scriptData.characters.find(c => String(c.id) === String(charId));
      if (!char) return;

      // 检查是否为此镜头选择了特定变体
      const varId = shot.characterVariations?.[charId];
      if (varId) {
        const variation = char.variations?.find(v => v.id === varId);
        if (variation?.referenceImage) {
          referenceImages.push(variation.referenceImage);
          return; // 使用变体图片而不是基础图片
        }
      }

      // 回退到基础图片
      if (char.referenceImage) {
        referenceImages.push(char.referenceImage);
      }
    });
  }
  
  return referenceImages;
};

/**
 * 构建关键帧提示词 - 增强版
 * 为起始帧和结束帧生成详细的视觉描述
 */
export const buildKeyframePrompt = (
  basePrompt: string,
  visualStyle: string,
  cameraMovement: string,
  frameType: 'start' | 'end'
): string => {
  const stylePrompt = VISUAL_STYLE_PROMPTS[visualStyle] || visualStyle;
  const cameraGuide = getCameraMovementCompositionGuide(cameraMovement, frameType);
  
  // 针对起始帧和结束帧的特定指导
  const frameSpecificGuide = frameType === 'start' 
    ? `【起始帧要求】
- 建立清晰的初始状态和场景氛围
- 人物/物体的起始位置、姿态和表情要明确
- 为后续运动预留视觉空间和动势
- 初始光影和色调为整个镜头定下基调
- 确保构图具有视觉张力，引导观众视线`
    : `【结束帧要求】
- 展现动作完成后的最终状态
- 人物/物体的终点位置、姿态和情绪变化
- 体现镜头运动带来的视角变化
- 光影和色彩可以有戏剧性变化
- 构图应达到视觉高潮或情绪释放点`;

  return `${basePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【视觉风格】Visual Style
${stylePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【镜头运动】Camera Movement
${cameraMovement} (${frameType === 'start' ? 'Initial Frame 起始帧' : 'Final Frame 结束帧'})

【构图指导】Composition Guide
${cameraGuide}

${frameSpecificGuide}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【技术规格】Technical Specifications
• 画面比例：16:9 宽屏电影格式
• 分辨率：8K Ultra HD, photorealistic detail
• 镜头语言：Professional cinema camera aesthetics
• 景深控制：Shallow depth of field for subject emphasis

【视觉细节】Visual Details
• 光影层次：Three-point lighting with dramatic shadows and highlights
• 色彩饱和度：Rich, cinematic color grading with proper color temperature
• 材质质感：Detailed surface textures, fabric wrinkles, skin pores, environmental details
• 大气效果：Volumetric lighting, atmospheric haze, dust particles, realistic weather effects

【角色要求】Character Details (if applicable)
• 面部表情：Micro-expressions, emotional authenticity, eye contact and gaze direction
• 肢体语言：Natural body posture, weight distribution, muscle tension
• 服装细节：Fabric movement, realistic clothing physics, detailed costume textures
• 毛发细节：Individual hair strands, natural hair movement and physics

【环境要求】Environment Details
• 背景层次：Foreground, middle ground, background depth separation
• 空间透视：Accurate linear perspective, atmospheric perspective for depth
• 环境光影：Natural or artificial light sources, realistic shadow casting
• 细节丰富度：Environmental storytelling elements, textural variety

【氛围营造】Mood & Atmosphere
• 情绪基调：Match the emotional tone of the scene
• 色彩心理：Use color psychology to enhance narrative
• 视觉节奏：Balance between calm and dynamic visual elements
• 叙事暗示：Visual cues that hint at story progression

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【质量保证】Quality Assurance
✓ 主体清晰：Subject is in sharp focus with clear silhouette
✓ 背景过渡：Background elements transition naturally without abrupt changes
✓ 光影一致：Consistent lighting direction and quality
✓ 色彩协调：Harmonious color palette throughout the frame
✓ 构图平衡：Visual weight distribution follows rule of thirds or golden ratio
✓ 动作连贯性：Frame composition supports smooth transition to next frame`;
};

/**
 * 构建视频生成提示词
 */
export const buildVideoPrompt = (
  actionSummary: string,
  cameraMovement: string,
  videoModel: 'sora-2' | 'veo_3_1_i2v_s_fast_fl_landscape',
  language: string
): string => {
  const isChinese = language === '中文' || language === 'Chinese';
  
  if (videoModel === 'sora-2') {
    const template = isChinese 
      ? VIDEO_PROMPT_TEMPLATES.sora2.chinese 
      : VIDEO_PROMPT_TEMPLATES.sora2.english;
    
    return template
      .replace('{actionSummary}', actionSummary)
      .replace('{cameraMovement}', cameraMovement)
      .replace('{language}', language);
  } else {
    return VIDEO_PROMPT_TEMPLATES.veo.simple
      .replace('{actionSummary}', actionSummary)
      .replace('{cameraMovement}', cameraMovement)
      .replace('{language}', isChinese ? '中文' : language);
  }
};

/**
 * 从现有提示词中提取基础部分（移除追加的样式信息）
 */
export const extractBasePrompt = (fullPrompt: string, fallback: string): string => {
  const visualStyleIndex = fullPrompt.indexOf('\n\nVisual Style:');
  if (visualStyleIndex > 0) {
    return fullPrompt.substring(0, visualStyleIndex);
  }
  return fullPrompt || fallback;
};

/**
 * 生成唯一ID
 */
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}`;
};

/**
 * 延迟执行
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 图片文件转base64
 */
export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 创建关键帧对象
 */
export const createKeyframe = (
  id: string,
  type: 'start' | 'end',
  visualPrompt: string,
  imageUrl?: string,
  status: 'pending' | 'generating' | 'completed' | 'failed' = 'pending'
): Keyframe => {
  return {
    id,
    type,
    visualPrompt,
    imageUrl,
    status
  };
};

/**
 * 更新镜头中的关键帧
 */
export const updateKeyframeInShot = (
  shot: Shot,
  type: 'start' | 'end',
  keyframe: Keyframe
): Shot => {
  const newKeyframes = [...(shot.keyframes || [])];
  const idx = newKeyframes.findIndex(k => k.type === type);
  
  if (idx >= 0) {
    newKeyframes[idx] = keyframe;
  } else {
    newKeyframes.push(keyframe);
  }
  
  return { ...shot, keyframes: newKeyframes };
};
