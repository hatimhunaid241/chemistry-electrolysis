// Centralised UI-chrome string dictionary, keyed by string id per language.
// Lesson / experiment content lives with its data as { en, zh } nodes; this file
// holds only the reusable interface strings (nav, buttons, labels, states).

export const STRINGS = {
  // ---- App / header ----
  app_title:        { en: 'Electrolysis & Voltaic Cells', zh: '電解與伏打電池' },
  app_subtitle:     { en: 'HKDSE Chemistry Study Pack', zh: 'HKDSE 化學溫習套裝' },

  // ---- Navigation ----
  nav_lessons:      { en: 'Lessons', zh: '課堂' },
  nav_lab:          { en: 'Experiments', zh: '實驗' },
  nav_practice:     { en: 'AI Practice', zh: 'AI 練習' },
  nav_settings:     { en: 'Settings', zh: '設定' },

  // ---- Common buttons / actions ----
  btn_start:        { en: '▶ Start', zh: '▶ 開始' },
  btn_pause:        { en: '⏸ Pause', zh: '⏸ 暫停' },
  btn_reset:        { en: '↺ Reset', zh: '↺ 重設' },
  btn_back:         { en: '← Back', zh: '← 返回' },
  btn_back_lessons: { en: '← Back to lessons', zh: '← 返回課堂列表' },
  btn_back_sims:    { en: '← All simulations', zh: '← 所有模擬' },
  btn_back_lab:     { en: '← All experiments', zh: '← 所有實驗' },
  btn_back_lesson:  { en: '← Back to Lesson', zh: '← 返回課堂' },
  btn_take_quiz:    { en: 'Take Quiz →', zh: '開始測驗 →' },
  btn_next:         { en: 'Next →', zh: '下一題 →' },
  btn_new_question: { en: 'New Question', zh: '新題目' },
  btn_check:        { en: 'Check Answer', zh: '核對答案' },
  btn_show_hint:    { en: '💡 Show hint', zh: '💡 顯示提示' },
  btn_next_hint:    { en: 'Next hint →', zh: '下一個提示 →' },
  btn_finish_save:  { en: 'Finish & Save Score', zh: '完成並儲存分數' },
  btn_correct:      { en: '✓ Correct', zh: '✓ 正確' },
  btn_incorrect:    { en: '✗ Incorrect', zh: '✗ 錯誤' },
  btn_save:         { en: 'Save Settings', zh: '儲存設定' },
  btn_saved:        { en: '✓ Saved!', zh: '✓ 已儲存！' },
  btn_test:         { en: 'Test Connection', zh: '測試連線' },
  btn_testing:      { en: '⟳ Testing…', zh: '⟳ 測試中…' },
  btn_clear_key:    { en: 'Clear key', zh: '清除金鑰' },
  btn_launch:       { en: 'Launch →', zh: '啟動 →' },

  // ---- Lessons tab ----
  lessons_title:    { en: 'Lessons', zh: '課堂' },
  lessons_done_of:  { en: 'lessons completed', zh: '課堂已完成' },
  lessons_overall:  { en: 'Overall progress', zh: '整體進度' },
  lessons_done_tag: { en: '✓ Done', zh: '✓ 完成' },
  lessons_best:     { en: 'Best score:', zh: '最佳分數：' },

  // ---- Practice Lab ----
  lab_title:        { en: 'Experiments', zh: '實驗' },
  lab_subtitle:     { en: 'Every experiment in one place — each with objectives, method, live simulation, data, and a comprehension check.', zh: '所有實驗集於一處 —— 每個都設有目標、方法、即時模擬、數據及理解測驗。' },
  lab_open:         { en: 'Open experiment', zh: '開啟實驗' },
  lab_sec_objective:{ en: 'Objective', zh: '實驗目標' },
  lab_sec_method:   { en: 'Setup & Method', zh: '裝置與方法' },
  lab_sec_sim:      { en: 'Interactive Simulation', zh: '互動模擬' },
  lab_sec_data:     { en: 'Data & Graph', zh: '數據與圖表' },
  lab_sec_report:   { en: 'Auto Report', zh: '自動報告' },
  lab_sec_check:    { en: 'Comprehension Check', zh: '理解測驗' },
  lab_variables:    { en: 'Key variables', zh: '主要變數' },
  lab_steps:        { en: 'Method', zh: '步驟' },
  lab_readings:     { en: 'Readings', zh: '讀數' },
  lab_no_data:      { en: 'Press Start on the simulation to record data.', zh: '按下模擬的「開始」以記錄數據。' },
  lab_col_time:     { en: 'Time (s)', zh: '時間 (秒)' },

  // ---- Adaptive difficulty ----
  diff_label:       { en: 'Difficulty', zh: '難度' },
  diff_auto_up:     { en: 'Correct — difficulty raised', zh: '答對 —— 難度提升' },
  diff_auto_down:   { en: 'Incorrect — difficulty lowered', zh: '答錯 —— 難度降低' },
  diff_decrease:    { en: 'Decrease difficulty', zh: '降低難度' },
  diff_increase:    { en: 'Increase difficulty', zh: '提高難度' },
  diff_hint_low:    { en: 'Simple, single-step', zh: '簡單、單步' },
  diff_hint_mid:    { en: 'Standard HKDSE', zh: '標準 HKDSE' },
  diff_hint_high:   { en: 'Multi-step / combined', zh: '多步 / 綜合' },

  // ---- AI Practice tab ----
  practice_title:   { en: 'AI Practice', zh: 'AI 練習' },
  practice_subtitle:{ en: 'AI-generated HKDSE-style questions on demand', zh: '按需生成的 HKDSE 模式題目' },
  practice_session: { en: 'This session', zh: '本節' },
  practice_topic:   { en: 'Topic', zh: '課題' },
  practice_generate:{ en: '✦ Generate Question', zh: '✦ 生成題目' },
  practice_generating:{ en: 'Generating…', zh: '生成中…' },
  practice_need_key:{ en: '⚠ Set your API key in Settings first', zh: '⚠ 請先在設定中輸入 API 金鑰' },
  practice_your_ans:{ en: 'Your answer:', zh: '你的答案：' },
  practice_model_ans:{ en: 'Model Answer:', zh: '參考答案：' },
  practice_mark_scheme:{ en: 'Model Answer / Mark Scheme:', zh: '參考答案 / 評分準則：' },
  practice_self:    { en: 'Self-assess:', zh: '自我評分：' },
  practice_explanation:{ en: 'Explanation:', zh: '解釋：' },
  practice_mcq:     { en: 'Multiple Choice', zh: '選擇題' },
  practice_structured:{ en: 'Structured', zh: '結構題' },
  practice_write:   { en: 'Write your answer here…', zh: '在此寫下你的答案…' },
  practice_correct: { en: '✓ Correct!', zh: '✓ 正確！' },
  practice_incorrect:{ en: '✗ Incorrect', zh: '✗ 錯誤' },
  practice_by_topic:{ en: 'Overall Progress by Topic', zh: '按課題的整體進度' },
  practice_total_q: { en: 'Total questions', zh: '題目總數' },
  practice_correct_n:{ en: 'Correct', zh: '答對' },
  practice_accuracy:{ en: 'Accuracy', zh: '準確率' },
  practice_empty_chart:{ en: 'Complete practice questions to see your progress', zh: '完成練習題目以查看你的進度' },
  practice_marked_c:{ en: '✓ Marked correct', zh: '✓ 評為正確' },
  practice_marked_i:{ en: '✗ Marked incorrect', zh: '✗ 評為錯誤' },
  practice_mark:    { en: 'marks', zh: '分' },
  practice_mark_one:{ en: 'mark', zh: '分' },

  // ---- Quiz ----
  quiz_title:       { en: 'Lesson Quiz', zh: '課堂測驗' },
  quiz_answered:    { en: 'answered', zh: '已作答' },
  quiz_complete:    { en: 'Quiz Complete!', zh: '測驗完成！' },
  quiz_you_scored:  { en: 'You scored', zh: '你的得分' },

  // ---- Settings ----
  settings_title:   { en: 'Settings', zh: '設定' },
  settings_subtitle:{ en: 'Configure language and the AI provider used to generate practice questions', zh: '設定語言及用於生成練習題目的 AI 供應商' },
  settings_language:{ en: 'Language', zh: '語言' },
  settings_lang_desc:{ en: 'Choose the display language. This is also available from the header toggle.', zh: '選擇顯示語言。此設定亦可在頁首切換。' },
  settings_provider:{ en: 'AI Provider', zh: 'AI 供應商' },
  settings_model:   { en: 'Model', zh: '模型' },
  settings_custom_model:{ en: 'Or enter a custom model ID:', zh: '或輸入自訂模型 ID：' },
  settings_key_note:{ en: 'Your key is stored in this browser only (localStorage) and is sent directly to the selected AI provider — never to any other server.', zh: '你的金鑰只儲存在此瀏覽器（localStorage），並只會直接傳送至所選的 AI 供應商 —— 絕不會傳送至其他伺服器。' },
  settings_get_key: { en: 'Get a key →', zh: '取得金鑰 →' },
  settings_connected:{ en: '✓ Connected!', zh: '✓ 連線成功！' },
  settings_show:    { en: 'Show', zh: '顯示' },
  settings_hide:    { en: 'Hide', zh: '隱藏' },
  settings_key_cleared:{ en: 'Key cleared from this device.', zh: '已從此裝置清除金鑰。' },
  settings_tips:    { en: 'Tips for Best Results', zh: '取得最佳效果的提示' },

  // ---- Generic states ----
  state_loading:    { en: 'Loading…', zh: '載入中…' },
  state_error:      { en: 'Something went wrong.', zh: '發生錯誤。' },

  // ---- Electrode / reaction labels (shared by simulations) ----
  anode:            { en: 'Anode', zh: '陽極' },
  cathode:          { en: 'Cathode', zh: '陰極' },
  oxidation:        { en: 'Oxidation', zh: '氧化' },
  reduction:        { en: 'Reduction', zh: '還原' },
  voltage:          { en: 'Voltage', zh: '電壓' },
  temperature:      { en: 'Temperature', zh: '溫度' },
  concentration:    { en: 'Concentration', zh: '濃度' },
  current:          { en: 'Current', zh: '電流' },
  time_s:           { en: 'Time', zh: '時間' },
}
