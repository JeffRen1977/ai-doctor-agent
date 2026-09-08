import React from 'react'
import { Card, Typography, Divider } from 'antd'
import { Link } from 'react-router-dom'
import { useLanguageStore } from '../stores/languageStore'

const { Title, Paragraph, Text } = Typography

type LegalKind = 'privacy' | 'terms' | 'third-parties'

interface LegalPageProps {
  kind: LegalKind
}

const LegalPage: React.FC<LegalPageProps> = ({ kind }) => {
  const { language } = useLanguageStore()
  const zh = language !== 'en'

  const title =
    kind === 'privacy'
      ? zh ? '隐私政策' : 'Privacy Policy'
      : kind === 'terms'
        ? zh ? '用户协议' : 'Terms of Use'
        : zh ? '第三方处理者' : 'Third parties'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px 64px' }}>
      <Card>
        <Title level={2}>{title}</Title>
        <Paragraph type="secondary">
          {zh ? '版本 2026-09-07。上线前仍需律师审阅。本产品仅供健康参考，不是医疗器械，不能替代执业医师诊疗。' : 'Version 2026-09-07. This product is for wellness reference only and is not a medical device.'}
        </Paragraph>
        <Paragraph>
          <Link to="/login">{zh ? '返回登录' : 'Back to login'}</Link>
        </Paragraph>
        <Divider />

        {kind === 'privacy' && (
          <>
            <Title level={4}>{zh ? '我们处理哪些信息' : 'What we process'}</Title>
            <Paragraph>
              {zh
                ? '账号信息（邮箱、姓名）、健康档案、用药、穿戴设备数据、对话与 AI 解读结果、访问日志与同意记录。健康状况、病历、用药、生理指标属于敏感个人信息。'
                : 'Account data, health records, medications, wearable data, conversation and AI outputs, access logs, and consent records. Health data is sensitive personal information.'}
            </Paragraph>
            <Title level={4}>{zh ? '目的与法律依据' : 'Purposes'}</Title>
            <Paragraph>
              {zh
                ? '账号用于登录；健康存储用于保存您主动提交的档案；AI 解读仅在您单独同意后，把解读所需内容发给模型；统计分析仅在您同意 analytics 后进行；向境外提供（OpenAI / Gemini）必须单独同意 cross_border。'
                : 'Account login, health storage, AI inference (separate consent), analytics (optional), and cross-border transfer to OpenAI/Gemini (separate consent).'}
            </Paragraph>
            <Title level={4}>{zh ? '您的权利' : 'Your rights'}</Title>
            <Paragraph>
              {zh
                ? '您可以查阅、复制（设置中导出）、撤回 AI/健康处理同意、申请注销。撤回后已完成的处理仍然合法，但此后不会再用您的病历调用模型。已发到境外模型的内容无法从厂商处追回。'
                : 'You may access, export, withdraw AI/health consent, and delete your account. Content already sent to model providers cannot be recalled from them.'}
            </Paragraph>
            <Title level={4}>{zh ? '保存与安全' : 'Retention and security'}</Title>
            <Paragraph>
              {zh
                ? '数据存在云数据库中，传输使用 TLS。审计摘要默认不保存完整病历原文。对象存储中的病历文件保持私有。注销后业务明文会删除或匿名化；审计行保留哈希与时间以便证明曾处理过。'
                : 'Data is stored in the cloud with TLS in transit. Audit logs default to summaries, not full records. After deletion, business PHI is erased or anonymized; audit hashes may be retained.'}
            </Paragraph>
            <Paragraph>
              <Link to="/third-parties">{zh ? '查看第三方清单' : 'Third-party list'}</Link>
              {' · '}
              <Link to="/terms">{zh ? '用户协议' : 'Terms'}</Link>
            </Paragraph>
          </>
        )}

        {kind === 'terms' && (
          <>
            <Title level={4}>{zh ? '服务范围' : 'Scope'}</Title>
            <Paragraph>
              {zh
                ? '本服务是消费级健康助手。输出仅供参考，不构成诊断、处方或互联网诊疗。出现急症请立即就医或拨打急救电话。'
                : 'This is a consumer wellness assistant. Outputs are not diagnosis, prescriptions, or clinical care. Seek emergency care when needed.'}
            </Paragraph>
            <Title level={4}>{zh ? '账号与责任' : 'Account'}</Title>
            <Paragraph>
              {zh
                ? '您应提供真实邮箱并妥善保管密码。不得将服务用于违法用途。我们可在您违反协议或法规时中止服务。'
                : 'Keep your credentials secure. Do not use the service unlawfully. We may suspend accounts that violate these terms.'}
            </Paragraph>
            <Title level={4}>{zh ? '不提供的承诺' : 'What we do not promise'}</Title>
            <Paragraph>
              {zh
                ? '我们不承诺数据从不离开您的手机——云端 AI 做不到。我们也不把本产品宣称为医院信息系统或医疗器械。'
                : 'We do not claim data never leaves your phone. This is not a hospital information system or a medical device.'}
            </Paragraph>
            <Paragraph>
              <Link to="/privacy">{zh ? '隐私政策' : 'Privacy policy'}</Link>
            </Paragraph>
          </>
        )}

        {kind === 'third-parties' && (
          <>
            <Paragraph>
              {zh
                ? '下列接收方可能处理您的健康相关内容。中国用户默认使用国内模型；OpenAI / Gemini 需单独同意出境。'
                : 'These recipients may process health-related content. China deployments default to domestic models; OpenAI/Gemini require separate cross-border consent.'}
            </Paragraph>
            <Paragraph>
              <Text strong>OpenAI</Text> — {zh ? '对话与病历摘要，美国，仅在选择 openai 且您同意出境时' : 'prompts and summaries, US, only with openai + cross-border consent'}
            </Paragraph>
            <Paragraph>
              <Text strong>Google Gemini</Text> — {zh ? '同上，含图片/PDF，美国' : 'same, including images/PDFs, US'}
            </Paragraph>
            <Paragraph>
              <Text strong>{zh ? '通义千问 / 文心' : 'Qwen / Ernie'}</Text> — {zh ? '国内模型，用于解读与对话' : 'domestic models for inference'}
            </Paragraph>
            <Paragraph>
              <Text strong>Firebase / MongoDB</Text> — {zh ? '账号、档案、文件持久化，区域取决于部署' : 'account and records persistence'}
            </Paragraph>
            <Paragraph>
              <Text strong>Sentry</Text> — {zh ? '可选错误上报，默认不发送病历明文' : 'optional error reporting without PHI by default'}
            </Paragraph>
            <Paragraph>
              <Text strong>Telegram</Text> — {zh ? '仅在您绑定后发送日报摘要' : 'daily summaries only if you bind a chat'}
            </Paragraph>
            <Paragraph>
              <Link to="/privacy">{zh ? '返回隐私政策' : 'Back to privacy policy'}</Link>
            </Paragraph>
          </>
        )}
      </Card>
    </div>
  )
}

export default LegalPage
