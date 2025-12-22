import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield, Folder, Users, Share2, Server } from 'lucide-react';

const Home: React.FC = () => {
    return (
        <div>
            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '4rem 0' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: '#111' }}>
                    Enterprise file management<br />
                    <span style={{ color: '#666' }}>without the enterprise price tag.</span>
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#444', maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Multi-tenant file management and compliance platform built with Rust and React.
                    Self-host it. Own your data. Stop paying per-user fees.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <a href="https://github.com/clovalink/clovalink" className="btn">Get Started</a>
                    <Link to="/docs" className="btn" style={{ backgroundColor: '#fff', color: '#000', border: '1px solid #ddd' }}>
                        Read Docs
                    </Link>
                </div>
            </section>

            {/* Comparison Section */}
            <section style={{ padding: '4rem 0', borderTop: '1px solid #f0f0f0' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Why ClovaLink?</h2>
                <div style={{ overflowX: 'auto', maxWidth: '800px', margin: '0 auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem' }}>Provider</th>
                                <th style={{ padding: '1rem' }}>Cost</th>
                                <th style={{ padding: '1rem' }}>Annual (50 users)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>Box Business</td>
                                <td style={{ padding: '1rem' }}>$20/user/mo</td>
                                <td style={{ padding: '1rem' }}>$12,000</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>Dropbox Business</td>
                                <td style={{ padding: '1rem' }}>$18/user/mo</td>
                                <td style={{ padding: '1rem' }}>$10,800</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>Google Workspace Business</td>
                                <td style={{ padding: '1rem' }}>$12/user/mo</td>
                                <td style={{ padding: '1rem' }}>$7,200</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}><strong>ClovaLink</strong></td>
                                <td style={{ padding: '1rem' }}><strong>~$20/month VPS</strong></td>
                                <td style={{ padding: '1rem' }}><strong>~$240 total</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '4rem 0' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Key Features</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                    <FeatureCard
                        icon={<Folder />}
                        title="File Management"
                        desc="Upload/download with progress, folder hierarchy, versioning, and bulk operations."
                    />
                    <FeatureCard
                        icon={<Shield />}
                        title="Security & Compliance"
                        desc="HIPAA, SOX, GDPR modes. Role-based access control, two-factor authentication, and immutable audit logs."
                    />
                    <FeatureCard
                        icon={<Users />}
                        title="Multi-Tenancy"
                        desc="Complete data isolation, per-tenant branding, and department-based organization."
                    />
                    <FeatureCard
                        icon={<Share2 />}
                        title="Sharing"
                        desc="Expiring share links, password protection, and public upload portals."
                    />
                    <FeatureCard
                        icon={<Server />}
                        title="Flexible Storage"
                        desc="Use Local Filesystem, AWS S3, Wasabi (80% cheaper), Backblaze B2, or MinIO."
                    />
                    <FeatureCard
                        icon={<Check />}
                        title="Extensions"
                        desc="UI extensions, file processors (webhooks), and scheduled automations."
                    />

                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div style={{ padding: '2rem', border: '1px solid #eee', borderRadius: '12px' }}>
        <div style={{ marginBottom: '1rem', color: '#000' }}>{icon}</div>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: '#666' }}>{desc}</p>
    </div>
);

export default Home;
