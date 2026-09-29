"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import LandingPage from '@/components/LandingPage';
import LandingPageCompact from '@/components/landing/LandingPageCompact';
import TaskEditorToolbar from '@/components/writer/TaskEditorToolbar';
import Task1Editor from '@/components/writer/Task1Editor';
import EssayEditor from '@/components/writer/EssayEditor';
import TutorCommentSection from '@/components/writer/TutorCommentSection';
import TaskEditorActions from '@/components/writer/TaskEditorActions';
import WriterHomeLabs from '@/components/writer/WriterHomeLabs';
import LandingPricing from '@/components/landing/LandingPricing';
import WriterResultsPanel from '@/components/writer/WriterResultsPanel';
import WriterDetailedAnalysisLazy from '@/components/lazy/WriterDetailedAnalysisLazy';
import WriterArchivePanel from '@/components/writer/WriterArchivePanel';
import WriterComparisonSection from '@/components/writer/WriterComparisonSection';
import WriterFeedbackBanner from '@/components/writer/WriterFeedbackBanner';
import WriterFooter from '@/components/writer/WriterFooter';
import CreditsExhaustedCallout from '@/components/CreditsExhaustedCallout';
import CreditsTopUpModal from '@/components/CreditsTopUpModal';
import { useWriterWorkspace } from '@/hooks/useWriterWorkspace';
import 'react-medium-image-zoom/dist/styles.css';

const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });

export default function WriterShell({
  forceLanding: forceLandingProp = false,
  skipAppLanding: skipAppLandingProp = false,
}) {
  const {
    session,
    sessionStatus,
    forceLanding,
    skipAppLanding,
    adsCompact,
    isAuthOpen,
    setIsAuthOpen,
    authModalMessage,
    setAuthModalMessage,
    feedbackBanner,
    setFeedbackBanner,
    scrollToFeedbackForm,
    activeTab,
    setActiveTab,
    isMenuOpen,
    setIsMenuOpen,
    isLoggedIn,
    setIsLoggedIn,
    credits,
    darkMode,
    goToEvaluateDraft,
    showFirstRunBanner,
    startFirstRunSample,
    dismissFirstRunBanner,
    isGenLoadingT1,
    generateTask1Data,
    isGenLoadingLetter,
    generateLetterTask,
    customKeyword,
    setCustomKeyword,
    setGenTopicError,
    genTopicError,
    genLoading,
    handleGenerateTask2,
    task1Kind,
    setTask1Kind,
    setImageUploadError,
    resetTask1,
    resetTask2,
    timeLeft,
    timerActive,
    setTimerActive,
    isGtLetter,
    letterMeta,
    setLetterMeta,
    image,
    isDescribing,
    imageUploadError,
    handleImageUpload,
    isPromptOpen,
    setIsPromptOpen,
    promptT1Active,
    promptT2,
    setPromptT1Letter,
    setPromptT1Academic,
    setPromptT2,
    essayT1,
    essayT2,
    setEssayT1,
    setEssayT2,
    currentWordCount,
    targetWords,
    highlightRef,
    editorRef,
    handleScroll,
    renderColoredText,
    setIsFocused,
    playClickSound,
    activeTutorComment,
    setActiveTutorComment,
    saveCurrentToArchive,
    isSaved,
    isSavingArchive,
    activeResult,
    error,
    errorIs401,
    setError,
    setErrorIs401,
    handleAnalyze,
    loadingT1,
    loadingT2,
    activeResultsRef,
    downloadReport,
    shareReport,
    shareLoading,
    handleCriteriaScoreChange,
    handleResetToAiScores,
    activeResultT1,
    activeResultT2,
    activeAnalyzeLoading,
    appliedCorrections,
    handleReplaceWord,
    speak,
    triggerHighlight,
    insertLinkingWord,
    searchState,
    replaceNext,
    mergedLexicalUpgrade,
    handleApplyAllUpgrades,
    showCreditsExhausted,
    showCreditsTopUpModal,
    openCreditsTopUpModal,
    closeCreditsTopUpModal,
    setShowSupportModal,
    karaokeAudio,
    archive,
    clearArchive,
    handleDeleteArchiveEntry,
    handleReviewArchiveEntry,
    handleSubmit,
    shareModal,
    setShareModal,
    copyShareLink,
    nativeShareLink,
    showSupportModal,
    supportFirstFieldRef,
    showScrollTop,
    scrollProgress,
    handleScrollToTop,
  } = useWriterWorkspace({
    forceLandingFromServer: Boolean(forceLandingProp),
    skipAppLandingFromServer: Boolean(skipAppLandingProp),
  });

  const openLogin = (message) => {
    setAuthModalMessage(typeof message === 'string' && message.trim() ? message.trim() : null);
    setIsAuthOpen(true);
  };

  const showMarketingLanding =
    (sessionStatus === 'unauthenticated' && !skipAppLanding) || forceLanding;

  if (sessionStatus === 'loading' && !forceLanding) {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-[#F9FAFB] dark:bg-[#050505] text-slate-600 dark:text-slate-400"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="h-10 w-10 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin"
          role="status"
          aria-label="Loading"
        />
        <p className="text-sm font-medium tracking-tight normal-case">STRATUM</p>
      </div>
    );
  }

  if (showMarketingLanding) {
    return (
      <div className="relative min-h-[100dvh] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300 overflow-y-auto overflow-x-hidden pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0">
        <div className="relative z-0 min-h-[100dvh]">
          {adsCompact ? (
            <LandingPageCompact
              onLoginClick={openLogin}
              onFullAnalysisClick={() => {
                setAuthModalMessage('Sign up to see your Band Score');
                setIsAuthOpen(true);
              }}
              isLoggedIn={sessionStatus === 'authenticated'}
            />
          ) : (
            <LandingPage
              onLoginClick={openLogin}
              onFullAnalysisClick={() => {
                setAuthModalMessage('Sign up to see your Band Score');
                setIsAuthOpen(true);
              }}
              isLoggedIn={sessionStatus === 'authenticated'}
            />
          )}
          <WriterFooter
            minimal
            darkMode={darkMode}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoginClick={openLogin}
            onSubmitFeedback={handleSubmit}
            feedbackBanner={feedbackBanner}
            shareModal={shareModal}
            setShareModal={setShareModal}
            copyShareLink={copyShareLink}
            nativeShareLink={nativeShareLink}
            showSupportModal={showSupportModal}
            setShowSupportModal={setShowSupportModal}
            supportFirstFieldRef={supportFirstFieldRef}
            showScrollTop={showScrollTop}
            scrollProgress={scrollProgress}
            onScrollToTop={handleScrollToTop}
          />
          {isAuthOpen ? (
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => {
                setIsAuthOpen(false);
                setAuthModalMessage(null);
              }}
              onLoginSuccess={() => {
                setIsAuthOpen(false);
                setAuthModalMessage(null);
              }}
              message={authModalMessage}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto overflow-x-hidden transition-colors duration-300 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-0">
      <WriterFeedbackBanner
        feedbackBanner={feedbackBanner}
        onDismiss={() => setFeedbackBanner(null)}
        onGoToForm={() => {
          scrollToFeedbackForm();
          setFeedbackBanner(null);
        }}
      />
      <div className="relative z-0 flex flex-col flex-1 min-h-[100dvh]">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isLoggedIn={isLoggedIn}
          credits={credits}
          onLoginClick={openLogin}
          onCreditsClick={openCreditsTopUpModal}
        />
        {isAuthOpen ? (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => {
              setIsAuthOpen(false);
              setAuthModalMessage(null);
            }}
            onLoginSuccess={() => {
              setIsLoggedIn(true);
              setIsAuthOpen(false);
              setAuthModalMessage(null);
            }}
            message={authModalMessage}
          />
        ) : null}

        <div className="flex flex-1">
          <main className="flex-1 min-w-0 w-full max-w-7xl xl:max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-4 md:pt-8 pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-8 bg-white dark:bg-slate-950 transition-colors duration-300">
            {activeTab === 'Home' && (
              <WriterHomeLabs
                darkMode={darkMode}
                onEvaluateDraft={goToEvaluateDraft}
                showFirstRunBanner={showFirstRunBanner}
                credits={credits}
                onStartFirstRunSample={startFirstRunSample}
                onDismissFirstRun={dismissFirstRunBanner}
                isGenLoadingT1={isGenLoadingT1}
                onGenerateTask1Chart={generateTask1Data}
                isGenLoadingLetter={isGenLoadingLetter}
                onGenerateLetterTask={generateLetterTask}
                customKeyword={customKeyword}
                onCustomKeywordChange={(value) => {
                  setCustomKeyword(value);
                  setGenTopicError(null);
                }}
                genTopicError={genTopicError}
                genLoading={genLoading}
                onGenerateTask2={handleGenerateTask2}
              />
            )}
            {(activeTab === 'Task 1' || activeTab === 'Task 2') && (
              <>
                <div className="flex flex-col gap-6 lg:gap-8">
                  <div className="flex flex-col gap-6 lg:gap-8 xl:grid xl:grid-cols-[1fr_min(380px,32%)] xl:items-start xl:gap-6">
                    <div className="order-1 flex min-w-0 w-full flex-col gap-6 lg:gap-8 xl:col-start-1 xl:row-start-1">
                      <div className="p-5 sm:p-7 xl:p-8 rounded-2xl sm:rounded-[1.75rem] bg-white dark:bg-slate-900/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.04),0_12px_48px_rgba(15,23,42,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.25)] transition-all duration-300">
                        <TaskEditorToolbar
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          task1Kind={task1Kind}
                          setTask1Kind={setTask1Kind}
                          setImageUploadError={setImageUploadError}
                          onClearDraft={() => (activeTab === 'Task 1' ? resetTask1() : resetTask2())}
                          timeLeft={timeLeft}
                          timerActive={timerActive}
                          setTimerActive={setTimerActive}
                        />
                        {activeTab === 'Task 1' && (
                          <Task1Editor
                            isGtLetter={isGtLetter}
                            darkMode={darkMode}
                            letterMeta={letterMeta}
                            setLetterMeta={setLetterMeta}
                            image={image}
                            isDescribing={isDescribing}
                            imageUploadError={imageUploadError}
                            onImageUpload={handleImageUpload}
                          />
                        )}
                        <EssayEditor
                          activeTab={activeTab}
                          darkMode={darkMode}
                          isGtLetter={isGtLetter}
                          isPromptOpen={isPromptOpen}
                          setIsPromptOpen={setIsPromptOpen}
                          promptValue={activeTab === 'Task 1' ? promptT1Active : promptT2}
                          onPromptChange={(value) => {
                            if (activeTab === 'Task 1') {
                              if (task1Kind === 'gt_letter') setPromptT1Letter(value);
                              else setPromptT1Academic(value);
                            } else setPromptT2(value);
                          }}
                          essayValue={activeTab === 'Task 1' ? essayT1 : essayT2}
                          onEssayChange={(value) => {
                            if (activeTab === 'Task 1') setEssayT1(value);
                            else setEssayT2(value);
                          }}
                          currentWordCount={currentWordCount}
                          targetWords={targetWords}
                          highlightRef={highlightRef}
                          editorRef={editorRef}
                          onScroll={handleScroll}
                          renderColoredText={renderColoredText}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          playClickSound={playClickSound}
                        />
                        <TutorCommentSection
                          value={activeTutorComment}
                          onChange={setActiveTutorComment}
                          darkMode={darkMode}
                          onSave={() =>
                            saveCurrentToArchive({ tutorCommentOverride: activeTutorComment })
                          }
                          saveDisabled={!activeResult || !session?.user}
                          saveLoading={isSavingArchive}
                          isSaved={isSaved}
                        />
                        <TaskEditorActions
                          error={error}
                          errorIs401={errorIs401}
                          onDismissError={() => {
                            setError(null);
                            setErrorIs401(false);
                          }}
                          onAnalyze={() => {
                            handleAnalyze(activeTab === 'Task 1' ? 'task1' : 'task2');
                          }}
                          analyzeLoading={activeTab === 'Task 1' ? loadingT1 : loadingT2}
                          analyzeDisabled={credits <= 0}
                          creditsExhausted={credits <= 0}
                        />
                      </div>
                      {showCreditsExhausted && !activeResult && (
                        <CreditsExhaustedCallout
                          onOpenPackages={openCreditsTopUpModal}
                          onContactSupport={() => {
                            setShowSupportModal(false);
                            scrollToFeedbackForm();
                          }}
                        />
                      )}
                    </div>

                    <WriterResultsPanel
                      resultsRef={activeResultsRef}
                      loading={activeTab === 'Task 1' ? loadingT1 : loadingT2}
                      activeResult={activeResult}
                      darkMode={darkMode}
                      onCriteriaScoreChange={handleCriteriaScoreChange}
                      onResetToAiScores={handleResetToAiScores}
                      onPdf={downloadReport}
                      onShare={shareReport}
                      pdfDisabled={!activeResult}
                      shareDisabled={!activeResult}
                      shareLoading={shareLoading}
                      hasSavedAnalysis={Boolean(activeResultT1?.savedId || activeResultT2?.savedId)}
                    />

                    <WriterDetailedAnalysisLazy
                      activeTab={activeTab}
                      darkMode={darkMode}
                      activeResult={activeResult}
                      activeAnalyzeLoading={activeAnalyzeLoading}
                      loadingT1={loadingT1}
                      loadingT2={loadingT2}
                      isGtLetter={isGtLetter}
                      appliedCorrections={appliedCorrections}
                      handleReplaceWord={handleReplaceWord}
                      speak={speak}
                      triggerHighlight={triggerHighlight}
                      insertLinkingWord={insertLinkingWord}
                      playClickSound={playClickSound}
                      searchState={searchState}
                      replaceNext={replaceNext}
                      mergedLexicalUpgrade={mergedLexicalUpgrade}
                      handleApplyAllUpgrades={handleApplyAllUpgrades}
                      setEssayT1={setEssayT1}
                      setEssayT2={setEssayT2}
                      essayT1={essayT1}
                      essayT2={essayT2}
                    />
                  </div>

                  <WriterComparisonSection
                    activeResult={activeResult}
                    activeAnalyzeLoading={activeAnalyzeLoading}
                    activeTab={activeTab}
                    darkMode={darkMode}
                    karaokeAudio={karaokeAudio}
                  />
                </div>
              </>
            )}
            {activeTab === 'Archive' && (
              <WriterArchivePanel
                darkMode={darkMode}
                archive={archive}
                onClearArchive={clearArchive}
                onDownloadEntry={downloadReport}
                onDeleteEntry={handleDeleteArchiveEntry}
                onReviewEntry={handleReviewArchiveEntry}
                onGoToTask1={() => {
                  setActiveTab('Task 1');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>
        </div>
        {activeTab === 'Home' ? (
          <LandingPricing isLoggedIn={isLoggedIn} onLoginClick={openLogin} />
        ) : null}
        <WriterFooter
          darkMode={darkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLoginClick={openLogin}
          onSubmitFeedback={handleSubmit}
          feedbackBanner={feedbackBanner}
          shareModal={shareModal}
          setShareModal={setShareModal}
          copyShareLink={copyShareLink}
          nativeShareLink={nativeShareLink}
          showSupportModal={showSupportModal}
          setShowSupportModal={setShowSupportModal}
          supportFirstFieldRef={supportFirstFieldRef}
          showScrollTop={showScrollTop}
          scrollProgress={scrollProgress}
          onScrollToTop={handleScrollToTop}
        />

        <CreditsTopUpModal
          isOpen={showCreditsTopUpModal}
          onClose={closeCreditsTopUpModal}
          accountEmail={session?.user?.email || ''}
        />

      </div>
    </div>
  );
}
