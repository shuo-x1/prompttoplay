const WATERMARK_HTML = "<div id='ptp-watermark' style='position:fixed;top:0;left:0;background:rgba(0,0,0,0.75);color:#fff;padding:6px 14px;font:bold 13px sans-serif;z-index:99999;pointer-events:none;border-bottom-right-radius:8px;'>🎮 PromptToPlay</div>";

function injectWatermark(htmlCode) {
  if (/<\/body>/i.test(htmlCode)) {
    return htmlCode.replace(/<\/body>/i, WATERMARK_HTML + '\n</body>');
  }
  return htmlCode + '\n' + WATERMARK_HTML;
}

function shouldWatermark(userPlan, watermarkRemoved) {
  if (watermarkRemoved) return false;
  if (userPlan === 'pro' || userPlan === 'enterprise') return false;
  return true;
}

module.exports = { injectWatermark, shouldWatermark };
