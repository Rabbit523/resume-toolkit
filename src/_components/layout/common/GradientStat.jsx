import { Card, Statistic } from 'antd';

export function GradientStat({ title, value, gradient, icon }) {
  return (
    <Card
      style={{
        background: gradient,
        color: '#fff',
        borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}
    >
      <Statistic
        title={<span style={{ color: '#fff' }}>{title}</span>}
        value={value}
        prefix={icon}
        valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 600 }}
      />
    </Card>
  );
}
