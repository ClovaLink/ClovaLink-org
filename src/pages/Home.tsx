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

            {/* The Problem Section */}
            <section style={{ padding: '4rem 0', borderTop: '1px solid #f0f0f0' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>The Problem</h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
                    Enterprise file management has become absurdly expensive:
                </p>
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
                                <td style={{ padding: '1rem' }}>$20/user/month</td>
                                <td style={{ padding: '1rem' }}><strong>$12,000</strong></td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>Dropbox Business</td>
                                <td style={{ padding: '1rem' }}>$18/user/month</td>
                                <td style={{ padding: '1rem' }}><strong>$10,800</strong></td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>SharePoint</td>
                                <td style={{ padding: '1rem' }}>$12.50/user/month</td>
                                <td style={{ padding: '1rem' }}><strong>$7,500</strong> + Microsoft tax</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>Egnyte</td>
                                <td style={{ padding: '1rem' }}>$20/user/month</td>
                                <td style={{ padding: '1rem' }}><strong>$12,000</strong></td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee', backgroundColor: '#f8fffe' }}>
                                <td style={{ padding: '1rem' }}><strong>ClovaLink</strong></td>
                                <td style={{ padding: '1rem' }}><strong>~$20/month VPS + S3 storage</strong></td>
                                <td style={{ padding: '1rem' }}><strong style={{ color: '#059669' }}>~$300-400</strong> total</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Cost Breakdown Section */}
            <section style={{ padding: '4rem 0', borderTop: '1px solid #f0f0f0' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>ClovaLink Cost Breakdown</h2>
                <div style={{ overflowX: 'auto', maxWidth: '800px', margin: '0 auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '1rem' }}>Component</th>
                                <th style={{ padding: '1rem' }}>Monthly Cost</th>
                                <th style={{ padding: '1rem' }}>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>VPS (4GB RAM)</td>
                                <td style={{ padding: '1rem' }}>~$20</td>
                                <td style={{ padding: '1rem', color: '#666' }}>DigitalOcean, Linode, Hetzner, etc.</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}><strong>Backblaze B2</strong></td>
                                <td style={{ padding: '1rem' }}>~$3-5</td>
                                <td style={{ padding: '1rem', color: '#666' }}>$0.006/GB storage + $0.01/GB egress</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}><strong>OR Wasabi</strong></td>
                                <td style={{ padding: '1rem' }}>~$7</td>
                                <td style={{ padding: '1rem', color: '#666' }}>$6.99/mo minimum, no egress fees</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>PostgreSQL</td>
                                <td style={{ padding: '1rem' }}>Included</td>
                                <td style={{ padding: '1rem', color: '#666' }}>Self-hosted on VPS</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '1rem' }}>Redis</td>
                                <td style={{ padding: '1rem' }}>Included</td>
                                <td style={{ padding: '1rem', color: '#666' }}>Self-hosted on VPS</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #eee', backgroundColor: '#f8fffe' }}>
                                <td style={{ padding: '1rem' }}><strong>Total</strong></td>
                                <td style={{ padding: '1rem' }}><strong>~$25-30/mo</strong></td>
                                <td style={{ padding: '1rem' }}><strong style={{ color: '#059669' }}>~$300-360/year</strong> for 50 users</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', marginTop: '1.5rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Storage costs based on ~500GB usage. Scales with actual usage, not user count.
                </p>
                <p style={{ textAlign: 'center', marginTop: '1rem', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Most small businesses need 80% of enterprise features at 10% of the cost. <strong>ClovaLink delivers exactly that.</strong>
                </p>
            </section>

            {/* Who Is This For Section */}
            <section style={{ padding: '4rem 0', borderTop: '1px solid #f0f0f0' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Who Is This For?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ padding: '2rem', border: '2px solid #059669', borderRadius: '12px', backgroundColor: '#f8fffe' }}>
                        <h3 style={{ marginTop: 0, color: '#059669' }}>You Should Use ClovaLink If...</h3>
                        <ul style={{ paddingLeft: '1.2rem', color: '#333' }}>
                            <li style={{ marginBottom: '0.5rem' }}>You need HIPAA/SOX/GDPR compliance</li>
                            <li style={{ marginBottom: '0.5rem' }}>You manage multiple clients/tenants</li>
                            <li style={{ marginBottom: '0.5rem' }}>You want to stop paying per-user fees</li>
                            <li style={{ marginBottom: '0.5rem' }}>You need file requests from external users</li>
                            <li style={{ marginBottom: '0.5rem' }}>You want full control over your data</li>
                        </ul>
                    </div>
                    <div style={{ padding: '2rem', border: '1px solid #eee', borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0, color: '#666' }}>You Might Not Need ClovaLink If...</h3>
                        <ul style={{ paddingLeft: '1.2rem', color: '#666' }}>
                            <li style={{ marginBottom: '0.5rem' }}>You just need basic cloud storage</li>
                            <li style={{ marginBottom: '0.5rem' }}>You have 5 or fewer users</li>
                            <li style={{ marginBottom: '0.5rem' }}>You don't need compliance features</li>
                            <li style={{ marginBottom: '0.5rem' }}>You prefer not to self-host</li>
                            <li style={{ marginBottom: '0.5rem' }}>You need deep Microsoft 365 integration</li>
                        </ul>
                    </div>
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
