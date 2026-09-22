export function CommunitySection(): React.JSX.Element {
  return (
    <section className="home-community" aria-labelledby="community-title">
      <div className="home-community-inner">
        <div>
          <span>OPEN SOURCE COMMUNITY</span>
          <h2 id="community-title">一起完善 DevKeel</h2>
          <p>在 GitHub 分享安装问题、项目实践和改进建议，或通过 Pull Request 参与开发。</p>
        </div>
        <a className="home-button home-button-primary" href="https://github.com/MinLeeV5/devkeel/issues" target="_blank" rel="noopener noreferrer">交流与反馈</a>
      </div>
    </section>
  )
}
