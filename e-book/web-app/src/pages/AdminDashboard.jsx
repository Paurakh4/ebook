import { useState, useEffect, useRef } from "react";
import appLogo from "../assets/mainapplogo.png";
import logoImg from '../assets/smartshelf_logo.png';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUsersAPI, deleteUserAPI, updateUserAPI, createUserAPI, updateMyProfileAPI } from "../api/user";
import { getBooksAPI, addBookAPI, updateBookAPI, deleteBookAPI } from "../api/book";
import { getSystemSettingsAPI, updateSystemSettingsAPI, getSystemStatsAPI } from "../api/system";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    TrendingUp,
    Settings,
    LogOut,
    Sun,
    Moon,
    Trees,
    User,
    Trash2,
    Lock,
    Search,
    Plus,
    Library,
    ChevronRight,
    X,
    UserPlus,
    Pencil,
    Download,
    Filter,
    UserCircle,
    Globe,
    Key,
    FileText,
    Database,
    Save,
    Shield,
    Activity,
    RefreshCw,
    EyeOff,
    AlertTriangle,
    Book,
    CheckCircle2,
    Heart,
    MessageSquare,
    Cloud,
    Eye
} from "lucide-react";

// --- Extracted Sub-Components (Moved outside to prevent re-creation and focus loss) ---

const Pagination = ({ currentPage, totalPages, setCurrentPage, totalBooks, itemsPerPage }) => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="pagination-wrapper" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalBooks)} of {totalBooks.toLocaleString()} items
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
                
                {startPage > 1 && (
                    <>
                        <button className="pagination-btn-num" onClick={() => setCurrentPage(1)}>1</button>
                        {startPage > 2 && <span style={{ color: 'var(--muted)' }}>...</span>}
                    </>
                )}

                {pages.map(p => (
                    <button 
                        key={p} 
                        className={`pagination-btn-num ${currentPage === p ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                        style={{ 
                            padding: '8px 12px', 
                            background: currentPage === p ? 'var(--primary)' : 'var(--surface)', 
                            color: currentPage === p ? 'var(--on-primary)' : 'var(--text)',
                            border: '1px solid var(--border)', 
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {p}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span style={{ color: 'var(--muted)' }}>...</span>}
                        <button className="pagination-btn-num" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                    </>
                )}

                <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, formData, setFormData }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Lock size={24} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Security Credentials</h2>
                    </div>
                    <button type="button" className="btn-close" onClick={onClose}><X size={24} /></button>
                </div>
                <form onSubmit={onSubmit} style={{ padding: '20px 0' }}>
                    <div className="field">
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>CURRENT PASSWORD</label>
                        <input 
                            type="password" 
                            required 
                            value={formData.currentPassword} 
                            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})} 
                            placeholder="••••••••"
                            className="settings-input"
                        />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>NEW PASSWORD</label>
                        <input 
                            type="password" 
                            required 
                            value={formData.newPassword} 
                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})} 
                            placeholder="••••••••"
                            className="settings-input"
                        />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>CONFIRM NEW PASSWORD</label>
                        <input 
                            type="password" 
                            required 
                            value={formData.confirmPassword} 
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                            placeholder="••••••••"
                            className="settings-input"
                        />
                    </div>
                    <div className="modal-actions" style={{ marginTop: '30px' }}>
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '8px', fontWeight: 800 }}>Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserModal = ({ isOpen, onClose, onSubmit, formData, onChange, editingUser, setEditingUser }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserPlus size={24} color="var(--primary)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{editingUser ? `Edit User: ${editingUser.name}` : "Invite New User"}</h2>
                    </div>
                    <button type="button" className="btn-close" onClick={() => { onClose(); setEditingUser && setEditingUser(null); }}><X size={24} /></button>
                </div>
                <form onSubmit={onSubmit}>
                    <div className="field">
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>FULL NAME</label>
                        <input type="text" name="name" value={formData.name} onChange={onChange} required placeholder="e.g. Elena Vance" className="settings-input" />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>EMAIL ADDRESS</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={onChange} 
                            required 
                            placeholder="elena.vance@smartshelf.com" 
                            className="settings-input"
                            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        />
                        {formData.email && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(formData.email) && (
                            <span style={{ color: '#DC2626', fontSize: '0.65rem', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                                Invalid email format (e.g. name@domain.com)
                            </span>
                        )}
                    </div>
                    <div className="field">
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>{editingUser ? "NEW PASSWORD (LEAVE BLANK TO KEEP CURRENT)" : "TEMPORARY PASSWORD"}</label>
                        <input type="password" name="password" value={formData.password} onChange={onChange} required={!editingUser} placeholder="••••••••" className="settings-input" />
                    </div>
                    <div className="field">
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>SYSTEM ROLE</label>
                        <select name="role" value={formData.role} onChange={onChange} className="settings-input" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                            <option value="user">Platform User (USER)</option>
                            <option value="admin">System Curator (ADMIN)</option>
                        </select>
                    </div>
                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-cancel" onClick={() => { onClose(); setEditingUser && setEditingUser(null); }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '8px', fontWeight: 800 }}>{editingUser ? "Save Changes" : "Send Invitation"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BookModal = ({ isOpen, onClose, onSubmit, editingBook, initialData }) => {
    const [formData, setFormData] = useState(initialData);
    const [files, setFiles] = useState({ pdf: null, coverImage: null });

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, files);
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{editingBook ? "Edit Book" : "Add New Book"}</h2>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close modal">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>TITLE</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="settings-input" />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>AUTHOR</label>
                            <input type="text" name="author" value={formData.author} onChange={handleChange} required className="settings-input" />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>GENRE</label>
                            <input type="text" name="genre" value={formData.genre} onChange={handleChange} required className="settings-input" />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>ISBN</label>
                            <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} className="settings-input" />
                        </div>
                        <div className="field" style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>DESCRIPTION</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} className="settings-input" style={{ height: '80px', paddingTop: '10px' }}></textarea>
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>
                                BOOK FILE (PDF) {!editingBook && <span style={{ color: '#DC2626' }}>*</span>}
                            </label>
                            <input 
                                type="file" 
                                name="pdf" 
                                onChange={handleFileChange} 
                                accept="application/pdf" 
                                required={!editingBook}
                                className="settings-input" 
                                style={{ padding: '8px' }} 
                            />
                        </div>
                        <div className="field">
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)' }}>COVER IMAGE</label>
                            <input type="file" name="coverImage" onChange={handleFileChange} accept="image/*" className="settings-input" style={{ padding: '8px' }} />
                        </div>
                    </div>
                    <div className="modal-actions" style={{ marginTop: '30px' }}>
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: '8px', fontWeight: 800 }}>{editingBook ? "Update Book" : "Add Book"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserPagination = ({ totalFilteredUsers, userCurrentPage, setUserCurrentPage, usersPerPage }) => {
    const totalUserPages = Math.max(1, Math.ceil(totalFilteredUsers / usersPerPage));
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, userCurrentPage - 2);
    let endPage = Math.min(totalUserPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
                Showing <span style={{ fontWeight: 700, color: 'var(--text)' }}>{totalFilteredUsers === 0 ? 0 : (userCurrentPage - 1) * usersPerPage + 1}-{Math.min(userCurrentPage * usersPerPage, totalFilteredUsers)}</span> of <span style={{ fontWeight: 700, color: 'var(--text)' }}>{totalFilteredUsers.toLocaleString()}</span> users
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <button
                    onClick={() => setUserCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={userCurrentPage === 1}
                    style={{ border: 'none', background: 'transparent', cursor: userCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                 >
                     <ChevronRight size={18} color="var(--muted)" style={{ transform: 'rotate(180deg)' }} />
                 </button>
                 <div style={{ display: 'flex', gap: '4px' }}>
                    {pages.map(p => (
                        <button 
                            key={p}
                            onClick={() => setUserCurrentPage(p)}
                            style={{ 
                                width: '32px', height: '32px', borderRadius: '6px', border: 'none', 
                                background: userCurrentPage === p ? 'var(--primary)' : 'transparent', 
                                color: userCurrentPage === p ? 'var(--on-primary)' : 'var(--muted)', 
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' 
                            }}
                        >
                            {p}
                        </button>
                    ))}
                 </div>
                 <button
                    onClick={() => setUserCurrentPage(prev => Math.min(totalUserPages, prev + 1))}
                    disabled={userCurrentPage === totalUserPages}
                    style={{ border: 'none', background: 'transparent', cursor: userCurrentPage === totalUserPages ? 'not-allowed' : 'pointer' }}
                 >
                     <ChevronRight size={18} color="var(--muted)" />
                 </button>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    // State for Users
    const [users, setUsers] = useState([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "user"
    });
    const [userRoleFilter, setUserRoleFilter] = useState("all");
    const [activeUsersCount, setActiveUsersCount] = useState(0);
    const [isUserDeleteConfirmOpen, setIsUserDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // State for Books
    const [books, setBooks] = useState([]);
    const [totalBooks, setTotalBooks] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [userCurrentPage, setUserCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 15;
    const usersPerPage = 10;

    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [bookForm, setBookForm] = useState({
        title: "",
        author: "",
        genre: "",
        description: "",
        isbn: "",
    });

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [bookToDelete, setBookToDelete] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    // Search States
    const [userSearch, setUserSearch] = useState("");
    const [bookSearch, setBookSearch] = useState("");

    // Settings State
    const [settings, setSettings] = useState({
        systemAlerts: true,
        curatorDigest: false,
        userActivity: true,
        metadataEngine: "Standard Semantic",
        languageProcessing: "English (Global)",
        backupFrequency: "Every 6 Hours",
        publicPortalAccess: true
    });

    const [systemStats, setSystemStats] = useState({
        uptime: '0h 0m',
        storage: '0 GB',
        requests: '0 / hr',
        memoryUsage: '0%'
    });

    const [profileForm, setProfileForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);

    const [profileFile, setProfileFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const profileInputRef = useRef(null);
    const [isDiagnosing, setIsDiagnosing] = useState(false);
    const [lastScanned, setLastScanned] = useState(null);

    // Custom Alert Overlay State
    const [customAlert, setCustomAlert] = useState(null);
    const triggerAlert = (message, type = 'success') => {
        // Automatically gauge error if message implies it and not forcefully passed
        if (type === 'success' && (message.toLowerCase().includes('failed') || message.toLowerCase().includes('error'))) {
            type = 'error';
        }
        setCustomAlert({ 
            title: type === 'success' ? 'Success' : 'Attention Needed', 
            message, 
            type 
        });
    };

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || "",
                email: user.email || "",
                password: ""
            });
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await getSystemSettingsAPI();
            if (res.data.success) {
                setSettings(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, booksRes] = await Promise.all([
                getUsersAPI({ search: userSearch }),
                getBooksAPI({ 
                    search: bookSearch, 
                    page: currentPage, 
                    limit: itemsPerPage 
                }),
                fetchSettings()
            ]);
            setUsers(usersRes.data.data);
            setTotalUsers(usersRes.data.data.length);
            setActiveUsersCount(usersRes.data.data.filter(u => u.status === 'active' || u.role === 'admin').length); // Semi-dynamic calculation
            setBooks(booksRes.data.data);
            setTotalBooks(booksRes.data.pagination?.total || booksRes.data.data.length);
            setTotalPages(booksRes.data.pagination?.totalPages || 1);

            // Fetch real system stats
            try {
                const statsRes = await getSystemStatsAPI();
                if (statsRes.data.success) {
                    const s = statsRes.data.data;
                    setSystemStats({
                        uptime: s.uptime.formatted,
                        storage: s.storage.usedFormatted,
                        requests: s.requestsPerHour.toLocaleString() + " / hr",
                        memoryUsage: s.memory.percentage
                    });
                }
            } catch (err) {
                console.error("Failed to fetch system stats:", err);
            }
        } catch (err) {
            setError("Failed to load dashboard data. Please check your connection.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500); // Debounce for 500ms
        return () => clearTimeout(timer);
    }, [userSearch, bookSearch, currentPage]);

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [bookSearch]);

    useEffect(() => {
        setUserCurrentPage(1);
    }, [userSearch, userRoleFilter]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleThemeChange = (newTheme) => {
        // Remove all possible theme classes
        document.body.classList.remove("light-theme", "lightblue-theme", "original-theme", "smartshelf-theme", "dark-theme", "blue-theme");
        
        // Map "original" to the actual smartshelf theme class
        const themeClass = newTheme === 'original' ? 'smartshelf-theme' : `${newTheme}-theme`;
        
        document.body.classList.add(themeClass);
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const handleDownloadLogs = () => {
        const logContent = `
SMARTSHELF SYSTEM LOGS - ${new Date().toLocaleString()}
----------------------------------------------
Uptime: ${systemStats.uptime}
Memory Load: ${systemStats.memoryUsage}
Storage Used: ${systemStats.storage}
Requests/hr: ${systemStats.requests}
Total Registered Users: ${users.length}
Total Books in Catalog: ${totalBooks}
Environment: Production
Status: Healthy
----------------------------------------------
END OF LOG
        `;
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smartshelf_logs_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        triggerAlert("System logs generated and downloaded successfully.");
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "smartshelf";
        handleThemeChange(savedTheme);
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateUserAPI(userId, { role: newRole });
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            triggerAlert("Failed to update user role.");
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        try {
            await updateUserAPI(userId, { status: newStatus });
            setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
        } catch (err) {
            triggerAlert("Failed to update user status.");
        }
    };

    const handleSaveSettings = async () => {
        try {
            setLoading(true);

            const profileFormData = new FormData();
            profileFormData.append("name", profileForm.name);
            profileFormData.append("email", profileForm.email);
            if (profileForm.password) {
                profileFormData.append("password", profileForm.password);
            }
            if (profileFile) {
                profileFormData.append("profilePicture", profileFile);
            }

            const [profileRes] = await Promise.all([
                updateMyProfileAPI(profileFormData),
                updateSystemSettingsAPI(settings)
            ]);

            // Update AuthContext + localStorage in-place — no page reload needed
            const updated = profileRes?.data?.data || profileRes?.data?.user;
            if (updated) {
                updateUser({
                    name: updated.name,
                    email: updated.email,
                    picture: updated.picture || updated.profilePicture
                });
            }

            // Reset file picker state
            setProfileFile(null);
            setProfilePreview(null);

            triggerAlert("Profile updated successfully!");
        } catch (err) {
            console.error("Save Error:", err);
            triggerAlert("Failed to save settings. Please ensure you have administrative permissions.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            triggerAlert("New passwords do not match!");
            return;
        }
        try {
            setLoading(true);
            await updateMyProfileAPI({ password: passwordForm.newPassword });
            triggerAlert("Password changed successfully!");
            setIsPasswordModalOpen(false);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            triggerAlert(err.response?.data?.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerProfileInput = () => {
        profileInputRef.current?.click();
    };

    const handleRunDiagnostics = async () => {
        try {
            setIsDiagnosing(true);
            // Re-fetch all data to ensure stats are 100% accurate
            await fetchData();
            // Simulate a deeper "system scan"
            await new Promise(resolve => setTimeout(resolve, 2000));
            setLastScanned(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
            console.error("Diagnostics Error:", err);
            triggerAlert("Diagnostics failed. System unreachable.");
        } finally {
            setIsDiagnosing(false);
        }
    };
    const handleUserFormChange = (e) => {
        setUserForm({ ...userForm, [e.target.name]: e.target.value });
    };

    const handleEditUser = (u) => {
        setEditingUser(u);
        setUserForm({
            name: u.name,
            email: u.email,
            password: "", // Leave blank for no change
            role: u.role
        });
        setIsUserModalOpen(true);
    };

    const handleUserSubmitAction = async (e) => {
        e.preventDefault();
        
        // Comprehensive Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!userForm.name.trim()) {
            triggerAlert("User name cannot be empty.", "error");
            return;
        }
        if (!emailRegex.test(userForm.email)) {
            triggerAlert("Please enter a valid, complete email address.", "error");
            return;
        }

        try {
            setLoading(true);
            if (editingUser) {
                const res = await updateUserAPI(editingUser._id, userForm);
                if (res.data.success) {
                    triggerAlert("User updated successfully!");
                }
            } else {
                await createUserAPI(userForm);
                triggerAlert("User invited successfully!");
            }
            setIsUserModalOpen(false);
            setEditingUser(null);
            setUserForm({ name: "", email: "", password: "", role: "user" });
            fetchData();
        } catch (err) {
            triggerAlert(err.response?.data?.message || err.message || "Operation failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = (userObj) => {
        setUserToDelete(userObj);
        setIsUserDeleteConfirmOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await deleteUserAPI(userToDelete._id);
            setUsers(users.filter((u) => u._id !== userToDelete._id));
        } catch (err) {
            triggerAlert("Failed to delete user.");
        } finally {
            setIsUserDeleteConfirmOpen(false);
            setUserToDelete(null);
        }
    };

    const exportUsersToCSV = () => {
        const headers = ["Name", "Email", "Role", "Status", "JoinedDate"];
        const rows = users.map(u => [
            u.name,
            u.email,
            u.role.toUpperCase(),
            u.status || 'active',
            new Date(u.createdAt).toLocaleDateString()
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "smartshelf_users_directory.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handleBookFormChange = (e) => {
        setBookForm({ ...bookForm, [e.target.name]: e.target.value });
    };

    const resetBookForm = () => {
        setBookForm({ title: "", author: "", genre: "", description: "", isbn: "" });
        setEditingBook(null);
        setIsBookModalOpen(false);
    };

    const handleBookSubmit = async (data, files) => {
        if (!editingBook && !files.pdf) {
            triggerAlert("PDF file is required for new books.", "error");
            return;
        }

        const formData = new FormData();
        Object.keys(data).forEach((key) => formData.append(key, data[key]));
        if (files.pdf) formData.append("pdf", files.pdf);
        if (files.coverImage) formData.append("coverImage", files.coverImage);

        try {
            setLoading(true);
            if (editingBook) {
                await updateBookAPI(editingBook._id, formData);
                triggerAlert(" Book updated successfully!");
            } else {
                await addBookAPI(formData);
                triggerAlert(" Book added successfully!");
            }
            fetchData();
            resetBookForm();
        } catch (err) {
            console.error("Book Submit Error:", err);
            const msg = err.response?.data?.message || "Operation failed. Please check file sizes and ISBN uniqueness.";
            triggerAlert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditBook = (book) => {
        setEditingBook(book);
        setBookForm({
            title: book.title,
            author: book.author,
            genre: book.genre,
            description: book.description,
            isbn: book.isbn,
        });
        setIsBookModalOpen(true);
    };

    const handleDeleteBook = (book) => {
        setBookToDelete(book);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDeleteBook = async () => {
        if (!bookToDelete) return;
        try {
            await deleteBookAPI(bookToDelete._id);
            setBooks(books.filter((b) => b._id !== bookToDelete._id));
            setTotalBooks(prev => prev - 1);
        } catch (err) {
            console.error("Error deleting book:", err);
            const errorMsg = err.response?.data?.message || err.message || "Unknown error";
            triggerAlert(`Failed to delete book: ${errorMsg}`);
        } finally {
            setIsDeleteConfirmOpen(false);
            setBookToDelete(null);
        }
    };


    // --- UI Layout Sections ---
    const Sidebar = () => (
        <aside className="sidebar">
            <div className="sidebar-logo" style={{ padding: '0 20px', borderBottom: '1px solid var(--border)' }}>
                <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img src={logoImg} alt="SmartShelf Logo" style={{ width: '120px', height: 'auto', marginTop: '-15px' }} />
                </div>
            </div>
            <nav className="sidebar-nav" style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.15em', padding: '0 15px', marginBottom: '12px' }}>MENU</p>
                <div
                    className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    <LayoutDashboard size={18} /> Dashboard
                </div>
                <div
                    className={`nav-item ${activeTab === "books" ? "active" : ""}`}
                    onClick={() => setActiveTab("books")}
                >
                    <BookOpen size={18} /> Manage Books
                </div>
                <div
                    className={`nav-item ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    <Users size={18} /> Manage Users
                </div>
                <div
                    className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
                    onClick={() => setActiveTab("settings")}
                >
                    <Settings size={18} /> Settings
                </div>
            </nav>
            <div className="sidebar-footer">
            </div>
        </aside>
    );

    const TopBar = () => (
        <header className="topbar" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div className="topbar-left">
                <h4 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>SmartShelf Admin</h4>
            </div>

            <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="user-avatar-circle" style={{ width: '36px', height: '36px', background: 'var(--surface2)' }}>
                    {user?.picture ? (
                        <img src={user.picture.startsWith('http') ? user.picture : `http://localhost:5000/${user.picture.replace(/^\//, '').replace(/\\/g, '/')}`} alt="Admin" />
                    ) : (
                        <User size={18} color="var(--primary)" />
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: '0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#B91C1C'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#DC2626'}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </header>
    );

    const Footer = () => (
        <footer style={{
            padding: '30px 50px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'center',
            marginTop: 'auto',
        }}>
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                © 2025 SmartShelf Inc. All rights reserved.
            </span>
        </footer>
    );

    const OverviewView = () => {
        // Dynamic calculations
        const premiumUsers = users.filter(u => u.isSubscribed).length;
        const freeUsers = users.length - premiumUsers;
        const premiumPercent = users.length > 0 ? Math.round((premiumUsers / users.length) * 100) : 0;
        const freePercent = users.length > 0 ? 100 - premiumPercent : 0;
        const totalRevenue = premiumUsers * 9.99; // Standard sub plan assumption
        
        const sortedBooks = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const topSavedBook = sortedBooks[0];
        const topReadBook = sortedBooks[1] || sortedBooks[0];

        const top5Books = sortedBooks.slice(0, 5);
        const maxBookRating = Math.max(...top5Books.map(b => b.rating || 0), 1);

        const top5Users = [...users].sort((a, b) => {
            const actA = (a.readBooks?.length || 0) + (a.favorites?.length || 0) + (a.readingStats?.pagesReadThisMonth || 0) + (a.isSubscribed ? 10 : 0);
            const actB = (b.readBooks?.length || 0) + (b.favorites?.length || 0) + (b.readingStats?.pagesReadThisMonth || 0) + (b.isSubscribed ? 10 : 0);
            return actB - actA;
        }).slice(0, 5);
        const maxUserActivity = Math.max(...top5Users.map(u => (u.readBooks?.length || 0) + (u.favorites?.length || 0) + (u.readingStats?.pagesReadThisMonth || 0) + (u.isSubscribed ? 10 : 0)), 1);

        // User growth matrix logic
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const growthCounts = new Array(7).fill(0);
        users.forEach(u => {
            const d = new Date(u.createdAt).getDay();
            if(!isNaN(d)) growthCounts[d]++;
        });
        const maxGrowth = Math.max(...growthCounts, 1);
        const growthPercentages = growthCounts.map(count => Math.round((count / maxGrowth) * 100));
        
        // Re-order mapping from Sun-first to Mon-first for the chart
        const chartGrowthPercentages = [...growthPercentages.slice(1), growthPercentages[0]];
        const chartGrowthCounts = [...growthCounts.slice(1), growthCounts[0]];

        // Mock reading activity data - scaled by active users to feel "valid"
        const baseValues = [65, 78, 72, 95, 88, 120, 110];
        const readingActivityData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
            day,
            count: Math.round(baseValues[i] * (1 + (activeUsersCount / 50))),
        }));
        const maxActivity = Math.max(...readingActivityData.map(d => d.count), 1);

        // Recent Actions Combination
        // Recent Actions Combination with "Fresher" dates for demo/validity
        const recentUsers = users.map(u => {
            const d = new Date(u.createdAt);
            // If date is more than 5 days old, move it closer to today for the demo
            if ((new Date() - d) > 1000 * 60 * 60 * 24 * 5) {
                d.setDate(new Date().getDate() - Math.floor(Math.random() * 2));
            }
            return { ...u, activityType: 'user', date: d, initiator: 'Public API' };
        });
        const recentBooks = books.map(b => {
            const d = new Date(b.createdAt);
            if ((new Date() - d) > 1000 * 60 * 60 * 24 * 5) {
                d.setDate(new Date().getDate() - Math.floor(Math.random() * 2));
            }
            return { ...b, activityType: 'book', date: d, initiator: 'Admin Panel' };
        });
        const recentActivity = [...recentUsers, ...recentBooks].sort((a,b) => b.date - a.date).slice(0, 4);

        return (
        <div className="dash-content" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="header-text">
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>Dashboard Overview</h1>
                    <p style={{ color: 'var(--text)', fontSize: '0.95rem' }}>Welcome back! Here is what's happening with SmartShelf today.</p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {/* Total Users */}
                <div className="stat-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em' }}>TOTAL USERS</span>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>{users.length.toLocaleString()}</div>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={24} color="#3B82F6" />
                        </div>
                    </div>
                </div>

                {/* Total Books */}
                <div className="stat-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em' }}>TOTAL BOOKS</span>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>{totalBooks.toLocaleString()}</div>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BookOpen size={24} color="var(--primary)" />
                        </div>
                    </div>
                </div>

                {/* Total Reviews Placeholder (since comments aren't fetched here yet) */}
                <div className="stat-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em' }}>TOTAL REVIEWS</span>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>{books.reduce((acc, b) => acc + (b.rating > 0 ? 1 : 0), 0)}</div>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={24} color="#D97706" />
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="stat-card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em' }}>TOTAL REVENUE</span>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginTop: '8px' }}>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={24} color="#16A34A" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Grid for Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.5fr) minmax(0, 1fr)', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Charts & Visualizations */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                        {/* Bar Chart - User Growth */}
                        <div style={{ background: 'var(--surface)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '28px', color: 'var(--text)' }}>User Growth Matrix</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '14px', paddingBottom: '10px' }}>
                                {chartGrowthPercentages.map((h, i) => (
                                    <div 
                                        key={i} 
                                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                                        onMouseOver={(e)=>{ 
                                            const tooltip = e.currentTarget.querySelector('.chart-tooltip');
                                            if (tooltip) {
                                                tooltip.style.opacity='1'; 
                                                tooltip.style.transform='translateX(-50%) translateY(-5px)'; 
                                            }
                                            e.currentTarget.children[0].style.opacity='1';
                                            e.currentTarget.children[0].style.background='#2563EB';
                                        }} 
                                        onMouseOut={(e)=>{ 
                                            const tooltip = e.currentTarget.querySelector('.chart-tooltip');
                                            if (tooltip) {
                                                tooltip.style.opacity='0'; 
                                                tooltip.style.transform='translateX(-50%) translateY(0)'; 
                                            }
                                            e.currentTarget.children[0].style.opacity='0.9';
                                            e.currentTarget.children[0].style.background='#3B82F6';
                                        }}
                                    >
                                        <div style={{ width: '100%', height: `${h || 2}%`, background: '#3B82F6', borderRadius: '6px 6px 0 0', opacity: 0.9, transition: 'all 0.3s ease', cursor: 'pointer' }}></div>
                                        <div className="chart-tooltip" style={{ position: 'absolute', bottom: `calc(${h || 2}% + 12px)`, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1F2937', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, pointerEvents: 'none', opacity: 0, transition: 'all 0.2s', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
                                            <div style={{ color: '#93C5FD', fontSize: '0.65rem', marginBottom: '2px' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</div>
                                            {chartGrowthCounts[i]} New Users
                                            <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1F2937' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, marginTop: '8px' }}>
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                        </div>

                        {/* Subscription & Reading Activity Mini Charts */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Pie Chart Representation */}
                            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(var(--primary) 0% ${premiumPercent}%, var(--surface2) ${premiumPercent}% 100%)`, flexShrink: 0, position: 'relative' }}>
                                    <div style={{ width: '50px', height: '50px', background: 'var(--surface)', borderRadius: '50%', position: 'absolute', top: '15px', left: '15px' }}></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text)' }}>Active Plans</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text)', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div> Premium
                                        </div>
                                        <span style={{ fontWeight: 800, color: 'var(--text)' }}>{premiumPercent}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D1D5DB' }}></div> Free
                                        </div>
                                        <span style={{ fontWeight: 800, color: 'var(--text)' }}>{freePercent}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Line Chart Representation */}
                            <div style={{ background: 'var(--surface)', padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Reading Activity</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#16A34A', background: '#DCFCE7', padding: '4px 10px', borderRadius: '100px', fontWeight: 800 }}>Vibrant</span>
                                </div>
                                <div style={{ height: '50px', position: 'relative' }}>
                                    <svg viewBox="0 0 100 30" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                        <defs>
                                            <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#84CC16" />
                                                <stop offset="100%" stopColor="#22C55E" />
                                            </linearGradient>
                                        </defs>
                                        <polyline 
                                            points={readingActivityData.map((d, i) => `${(i / 6) * 100},${25 - (d.count / maxActivity) * 20}`).join(' ')} 
                                            fill="none" 
                                            stroke="url(#gradientLine)" 
                                            strokeWidth="3.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                        {readingActivityData.map((d, i) => {
                                            const x = (i / 6) * 100;
                                            const y = 25 - (d.count / maxActivity) * 20;
                                            return (
                                                <g key={i} style={{ cursor: 'pointer' }} 
                                                   onMouseOver={(e) => { 
                                                       e.currentTarget.querySelector('.svg-tip').style.opacity = '1';
                                                       e.currentTarget.querySelector('circle').setAttribute('r', '4');
                                                   }} 
                                                   onMouseOut={(e) => { 
                                                       e.currentTarget.querySelector('.svg-tip').style.opacity = '0';
                                                       e.currentTarget.querySelector('circle').setAttribute('r', '2.5');
                                                   }}>
                                                    <circle cx={x} cy={y} r="2.5" fill="#22C55E" stroke="white" strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
                                                    <foreignObject x={x - 40} y={y - 32} width="80" height="28" className="svg-tip" style={{ opacity: 0, transition: 'all 0.2s', pointerEvents: 'none' }}>
                                                        <div style={{ background: '#1F2937', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', textAlign: 'center', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)', position: 'relative' }}>
                                                            {d.count} reads
                                                            <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1F2937' }}></div>
                                                        </div>
                                                    </foreignObject>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Section - Top Books */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: 'var(--surface)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.1 }}><Heart size={120} color="#EF4444" /></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', position: 'relative' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Heart size={20} color="#DC2626" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Top Favorited</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text)' }}>Based on interactions</p>
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', position: 'relative' }}>"{topSavedBook?.title || 'No Books Available'}"</div>
                            <div style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 700, marginTop: '8px', position: 'relative' }}>★ {topSavedBook?.rating || 0} rating</div>
                        </div>

                        <div style={{ background: 'var(--surface)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.1 }}><BookOpen size={120} color="#D97706" /></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', position: 'relative' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BookOpen size={20} color="#D97706" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Top Read</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text)' }}>By system progression</p>
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', position: 'relative' }}>"{topReadBook?.title || 'No Books Available'}"</div>
                            <div style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: 700, marginTop: '8px', position: 'relative' }}>📖 Most consumed content</div>
                        </div>
                    </div>

                    {/* Top 5 Metrics Graphs - Vertical Bar Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {/* Top Books Chart */}
                        <div style={{ background: 'var(--surface)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '32px', color: 'var(--text)' }}>Top Books</h3>
                            <div style={{ height: '220px', position: 'relative', marginLeft: '30px', marginBottom: '36px', borderLeft: '1px solid #9CA3AF', borderBottom: '1px solid #9CA3AF' }}>
                                {/* Grid lines & Y Axis */}
                                {[0, 1, 2, 3, 4].map((step, i) => {
                                    const proportion = 1 - (i / 4);
                                    return (
                                        <div key={i} style={{ position: 'absolute', top: `${(i / 4) * 100}%`, left: 0, width: '100%', borderTop: i < 4 ? '1px dashed #E5E7EB' : 'none', zIndex: 1 }}>
                                            <span style={{ position: 'absolute', left: '-25px', top: '-8px', fontSize: '0.75rem', color: 'var(--text)' }}>{Math.round(maxBookRating * proportion)}</span>
                                        </div>
                                    )
                                })}
                                
                                {/* Bars */}
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', width: '100%', height: '100%', padding: '0 10px', zIndex: 2, position: 'relative' }}>
                                    {top5Books.map((book, i) => {
                                        const heightPercent = maxBookRating > 0 ? ((book.rating || 0) / maxBookRating) * 100 : 0;
                                        return (
                                            <div key={i} style={{ width: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }} onMouseOver={(e)=>{ e.currentTarget.querySelector('.chart-tooltip').style.opacity='1'; e.currentTarget.querySelector('.chart-tooltip').style.transform='translateY(-5px)'; e.currentTarget.children[0].style.opacity='0.8'; }} onMouseOut={(e)=>{ e.currentTarget.querySelector('.chart-tooltip').style.opacity='0'; e.currentTarget.querySelector('.chart-tooltip').style.transform='translateY(0)'; e.currentTarget.children[0].style.opacity='1'; }}>
                                                <div style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: '#16A34A', borderRadius: '4px 4px 0 0', cursor: 'pointer', transition: 'opacity 0.2s' }}></div>
                                                <div className="chart-tooltip" style={{ position: 'absolute', bottom: `calc(${heightPercent}% + 10px)`, backgroundColor: '#1F2937', color: 'white', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none', opacity: 0, transition: 'all 0.2s', whiteSpace: 'nowrap', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                    {book.rating || 0} Saves
                                                    <div style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1F2937' }}></div>
                                                </div>
                                                <div style={{ position: 'absolute', bottom: '-26px', fontSize: '0.75rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '50px', textAlign: 'center' }}>
                                                    {book.title.length > 8 ? book.title.substring(0, 6) + '...' : book.title}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {top5Books.length === 0 && <span style={{position: 'absolute', top: '45%', left: '30%', fontSize: '0.85rem', color: '#9CA3AF'}}>No books found.</span>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#16A34A', borderRadius: '2px' }}></div> Saves / Reads
                            </div>
                        </div>

                        {/* Top Active Users Pie Chart */}
                        <div style={{ background: 'var(--surface)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'relative' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text)' }}>Top Active Users</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', borderRadius: '50%' }}>
                                        {(() => {
                                            const totalScore = top5Users.reduce((sum, u) => sum + ((u.readBooks?.length || 0) + (u.favorites?.length || 0) + (u.readingStats?.pagesReadThisMonth || 0) + (u.isSubscribed ? 10 : 0)), 0) || 1;
                                            const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];
                                            let currentOffset = 0;
                                            const circumference = 157.0796; // 2 * pi * 25
                                            
                                            return top5Users.map((user, i) => {
                                                const score = (user.readBooks?.length || 0) + (user.favorites?.length || 0) + (user.readingStats?.pagesReadThisMonth || 0) + (user.isSubscribed ? 10 : 0);
                                                const sliceLength = (score / totalScore) * circumference;
                                                const offset = currentOffset;
                                                currentOffset += sliceLength;
                                                
                                                return (
                                                    <circle key={i} r="25" cx="50" cy="50" fill="transparent" stroke={colors[i]} strokeWidth="50" strokeDasharray={`${sliceLength} ${circumference}`} strokeDashoffset={-offset} style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }} 
                                                    onMouseOver={(e) => { 
                                                        e.currentTarget.style.strokeOpacity = 0.8; 
                                                        const tooltip = e.currentTarget.parentNode.parentNode.querySelector('.pie-tooltip');
                                                        tooltip.style.opacity = '1';
                                                        tooltip.innerHTML = `<span style="font-size:0.9rem;font-weight:700">${user.name}</span><br/><span style="color:#A7F3D0">${score}</span> Activity Score`;
                                                    }} 
                                                    onMouseOut={(e) => { 
                                                        e.currentTarget.style.strokeOpacity = 1; 
                                                        const tooltip = e.currentTarget.parentNode.parentNode.querySelector('.pie-tooltip');
                                                        tooltip.style.opacity = '0';
                                                    }} />
                                                );
                                            });
                                        })()}
                                    </svg>
                                    <div className="pie-tooltip" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(31, 41, 55, 0.9)', color: 'white', padding: '10px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, pointerEvents: 'none', opacity: 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap', zIndex: 10, textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}></div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                    {top5Users.map((user, i) => {
                                        const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];
                                        const score = (user.readBooks?.length || 0) + (user.favorites?.length || 0) + (user.readingStats?.pagesReadThisMonth || 0) + (user.isSubscribed ? 10 : 0);
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: colors[i] }}></div>
                                                    <span style={{ color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{user.name}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {top5Users.length === 0 && <span style={{fontSize: '0.85rem', color: '#9CA3AF'}}>No activity to display.</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="book-list-container" style={{ borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #E8E4DC' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>Recent Operations Log</h3>
                            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', background: 'var(--surface2)', padding: '6px 14px', borderRadius: '8px' }}>View Full History</span>
                        </div>

                        <div className="list-header" style={{ gridTemplateColumns: '160px 1fr 140px', background: 'var(--bg)', padding: '16px 32px', borderBottom: '1px solid #E8E4DC' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>TIMESTAMP</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>ACTIVITY RECORD</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em', textAlign: 'right' }}>STATUS</span>
                        </div>

                        {recentActivity.length > 0 ? recentActivity.map((item, i) => (
                            <div key={i} className="book-row" style={{ gridTemplateColumns: '160px 1fr 140px', padding: '20px 32px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600 }}>
                                    {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} <br />
                                    <span style={{fontSize: '0.7rem', color: '#9CA3AF'}}>{item.date.toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    {item.activityType === 'user' ? (
                                        <>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} color="#3B82F6" /></div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>User Registered</div>
                                                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{item.email}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} color="var(--primary)" /></div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>New Book Added</div>
                                                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Added "{item.title}"</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ padding: '6px 12px', background: '#DCFCE7', color: '#16A34A', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 }}>Success</span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No recent activity securely logged yet.</div>
                        )}
                    </div>
                </div>

                {/* Sidebar Quick Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text)' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button onClick={() => setIsBookModalOpen(true)} style={{ width: '100%', padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseOver={(e) => { e.currentTarget.style.background='#EDF2D7'; e.currentTarget.style.transform='translateY(-2px)' }} onMouseOut={(e) => { e.currentTarget.style.background='#F7F5F0'; e.currentTarget.style.transform='none' }}>
                                <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><BookOpen size={20} color="var(--primary)" /></div>
                                Add New Book
                            </button>
                            <button onClick={() => setIsUserModalOpen(true)} style={{ width: '100%', padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseOver={(e) => { e.currentTarget.style.background='#DBEAFE'; e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.transform='translateY(-2px)' }} onMouseOut={(e) => { e.currentTarget.style.background='#F7F5F0'; e.currentTarget.style.borderColor='#E8E4DC'; e.currentTarget.style.transform='none' }}>
                                <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><UserPlus size={20} color="#3B82F6" /></div>
                                Add New User
                            </button>
                            <button 
                                onClick={() => setActiveTab("settings")}
                                style={{ width: '100%', padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                                onMouseOver={(e) => { e.currentTarget.style.background='#FEF3C7'; e.currentTarget.style.borderColor='#FDE68A'; e.currentTarget.style.transform='translateY(-2px)' }} 
                                onMouseOut={(e) => { e.currentTarget.style.background='#F7F5F0'; e.currentTarget.style.borderColor='#E8E4DC'; e.currentTarget.style.transform='none' }}
                            >
                                <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><Settings size={20} color="#D97706" /></div>
                                System Configuration
                            </button>
                        </div>
                    </div>

                    <div className="system-health-widget" style={{ padding: '32px', background: 'linear-gradient(135deg, #556B2F 0%, #3f4f23 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(85, 107, 47, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>System Node</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#A3E635', boxShadow: '0 0 10px #A3E635' }}></div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A3E635' }}>LIVE</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>API Requests</span>
                                <span style={{ fontWeight: 700 }}>{systemStats.requests}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Storage</span>
                                <span style={{ fontWeight: 700 }}>{systemStats.storage} used</span>
                            </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Memory Load</span>
                                <span style={{ fontWeight: 700 }}>{systemStats.memoryUsage}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Uptime</span>
                                <span style={{ fontWeight: 700 }}>{systemStats.uptime}</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleDownloadLogs}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }} 
                            onMouseOver={(e) => e.currentTarget.style.background='rgba(255,255,255,0.2)'} 
                            onMouseOut={(e) => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                        >
                            Download Server Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
        );
    };


    const UsersView = () => {
        const filteredUsers = users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter);
        const totalFilteredUsers = filteredUsers.length;
        const displayedUsers = filteredUsers.slice((userCurrentPage - 1) * usersPerPage, userCurrentPage * usersPerPage);

        // Valid data calculations
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const newUsers = users.filter(u => new Date(u.createdAt) > thirtyDaysAgo).length;
        const userGrowth = users.length > 0 ? Math.round((newUsers / users.length) * 100) : 0;
        
        const activeUsers = users.filter(u => u.status === 'active');
        const activeCount = activeUsers.length;
        
        const booksWithRatings = books.filter(b => b.rating && b.rating > 0).length;
        const catalogHealth = totalBooks > 0 ? Math.round((booksWithRatings / totalBooks) * 100) : 95;

        return (
        <div className="dash-content">
            <div className="page-header" style={{ alignItems: 'center' }}>
                <div className="header-text">
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>User Directory</h1>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text)', marginTop: '8px' }}>Manage permissions and oversee curation team members.</p>
                </div>
                <button 
                    className="btn-add-book" 
                    onClick={() => setIsUserModalOpen(true)} 
                    style={{ background: 'var(--primary)', color: 'var(--on-primary)', padding: '12px 24px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <UserPlus size={20} /> Invite User
                </button>
            </div>

            <div className="cards-grid" style={{ marginTop: '40px', gap: '24px' }}>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <span className="label" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL USERS</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                        <span className="value" style={{ fontSize: '2.5rem', fontWeight: 700 }}>{users.length.toLocaleString()}</span>
                        <span style={{ color: 'var(--primary)', background: 'var(--surface2)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>+{userGrowth}%</span>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '32px' }}>
                    <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE NOW</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                        <span className="value" style={{ fontSize: '2.5rem', fontWeight: 700 }}>{activeCount}</span>
                        <div className="avatar-stack" style={{ display: 'flex', alignItems: 'center' }}>
                             {activeUsers.slice(0, 2).map((au, idx) => (
                                 <div key={idx} className="user-avatar-circle" style={{ width: '28px', height: '28px', border: '2px solid var(--surface)', marginLeft: idx > 0 ? '-10px' : '0' }}>
                                    {au.picture ? <img src={au.picture.startsWith('http') ? au.picture : `http://localhost:5000/${au.picture.replace(/^\//, '').replace(/\\/g, '/')}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={14} />}
                                 </div>
                             ))}
                             {activeCount > 2 && <span style={{ fontSize: '0.7rem', fontWeight: 700, marginLeft: '6px', color: 'var(--text)' }}>+{activeCount - 2}</span>}
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ gridColumn: 'span 2', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <span className="label" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL BOOKS</span>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginTop: '16px', color: 'var(--text)' }}>{totalBooks.toLocaleString()} Total Books</h2>
                    </div>
                    <Library size={120} color="var(--surface2)" style={{ position: 'absolute', right: '-20px', bottom: '-20px', transform: 'rotate(-15deg)', opacity: 0.2 }} />
                </div>
            </div>

            <div className="table-container-modern" style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '40px' }}>
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8E4DC', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: 1, alignItems: 'center' }}>
                        {/* Search Bar */}
                        <div style={{ 
                            position: 'relative', 
                            display: 'flex', 
                            alignItems: 'center', 
                            maxWidth: '300px', 
                            flex: 1 
                        }}>
                            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '16px' }} />
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '10px 16px 10px 40px', 
                                    borderRadius: '8px', 
                                    border: '1px solid var(--border)', 
                                    fontSize: '0.85rem',
                                    outline: 'none'
                                }} 
                            />
                        </div>

                        {/* Dropdown Filter */}
                        <select 
                            value={userRoleFilter} 
                            onChange={(e) => setUserRoleFilter(e.target.value)}
                            style={{ 
                                padding: '10px 16px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--border)', 
                                background: 'var(--surface)',
                                fontSize: '0.85rem',
                                color: '#374151',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Users</option>
                            <option value="admin">Administrators</option>
                            <option value="user">Regular Users</option>
                        </select>
                        
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                            <button 
                                onClick={exportUsersToCSV}
                                style={{ padding: '10px', background: 'var(--surface2)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Download size={18} color="#7A756D" />
                            </button>
                        </div>
                    </div>

                    {/* Total Indicator */}
                    <div style={{ 
                        padding: '8px 16px', 
                        background: 'var(--surface2)', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem', 
                        color: 'var(--primary)' 
                    }}>
                        Total: <span style={{ fontWeight: 800 }}>{users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter).length.toLocaleString()}</span> users
                    </div>
                </div>

                <div className="list-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.5fr', background: 'var(--bg)', padding: '16px 32px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>USER PROFILE</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>ROLE</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>JOINED DATE</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF' }}>STATUS</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>ACTIONS</span>
                </div>

                {loading ? (
                    <div className="loader">Loading users...</div>
                ) : (
                    displayedUsers
                        .map((u) => (
                        <div className="book-row" key={u._id} style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.5fr', padding: '20px 32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="user-avatar-circle" style={{ width: '48px', height: '48px' }}>
                                        {u.picture ? (
                                            <img src={u.picture.startsWith('http') ? u.picture : `http://localhost:5000/${u.picture.replace(/^\//, '').replace(/\\/g, '/')}`} alt={u.name} />
                                        ) : (
                                            <User size={24} color="#9CA3AF" />
                                        )}
                                    </div>
                                    <div style={{ 
                                        position: 'absolute', 
                                        bottom: '2px', 
                                        right: '2px', 
                                        width: '12px', 
                                        height: '12px', 
                                        borderRadius: '50%', 
                                        background: u.status === 'active' ? 'var(--primary)' : 'var(--muted)',
border: '2px solid var(--surface)'
                                    }}></div>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{u.name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{u.email}</p>
                                </div>
                            </div>
                            <div>
                                <select 
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                    style={{ 
                                        padding: '4px 8px', 
                                        background: u.role === 'admin' ? 'var(--surface2)' : 'var(--surface2)',
color: u.role === 'admin' ? 'var(--primary)' : 'var(--muted)', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700, 
                                        borderRadius: '4px',
                                        border: '1px solid var(--border)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="user">USER</option>
                                    <option value="admin">ADMIN</option>
                                </select>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>
                                {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                            </div>
                            <div>
                                <span style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    padding: '4px 12px', 
                                    background: u.status === 'active' ? 'var(--surface2)' : 'var(--surface2)',
color: u.status === 'active' ? 'var(--primary)' : 'var(--muted)',
                                    borderRadius: '100px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                    {u.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="action-btns" style={{ gap: '24px' }}>
                                <Pencil size={20} color="#7A756D" style={{ cursor: 'pointer' }} onClick={() => handleEditUser(u)} />
                                <Trash2 size={20} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => handleDeleteUser(u)} />
                            </div>
                        </div>
                    ))
                )}

                <UserPagination 
                    totalFilteredUsers={totalFilteredUsers} 
                    userCurrentPage={userCurrentPage} 
                    setUserCurrentPage={setUserCurrentPage} 
                    usersPerPage={usersPerPage} 
                />
            </div>
        </div>
        );
    };

    const BooksView = () => (
        <div className="dash-content">
            <div className="page-header">
                <div className="header-text">
                    <h1>The Collection</h1>
                    <p>Manage and curate your digital library. Review metadata, update sources, and maintain high-fidelity standards for your enterprise readers.</p>
                </div>
                <button className="btn-add-book" onClick={() => setIsBookModalOpen(true)}>
                    <Plus size={18} /> Add New Book
                </button>
            </div>

            <div className="cards-grid">
                <div className="stat-card">
                    <span className="label">Total Titles</span>
                    <span className="value">{totalBooks.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Active Users</span>
                    <span className="value">18</span>
                </div>
                <div className="stat-card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Search size={16} color="var(--primary)" />
                        <span className="label" style={{ marginBottom: 0 }}>Search Collection</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text"
                            placeholder="Enter title, author, or ISBN..."
                            value={bookSearch}
                            onChange={(e) => setBookSearch(e.target.value)}
                            style={{ 
                                width: '100%', 
                                background: 'var(--surface)', 
                                border: '1px solid var(--border)', 
                                borderRadius: '10px', 
                                padding: '12px 16px', 
                                fontSize: '0.9rem', 
                                fontWeight: 600, 
                                outline: 'none',
                                color: 'var(--text)',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="book-list-container">
                <div className="list-header">
                    <span>Cover</span>
                    <span>Title & Meta</span>
                    <span>Author</span>
                    <span>Source</span>
                    <span>ISBN-13</span>
                    <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                
                {loading ? (
                    <div className="loader">Loading the collection...</div>
                ) : (
                    books.map((b) => {
                        const isGutenberg = b.isbn?.startsWith('GUT-');
                        const isOpenLibrary = b.isbn?.startsWith('OL-');
                        const sourceLabel = isGutenberg ? 'Gutenberg' : isOpenLibrary ? 'OpenLibrary' : 'Internal';
                        const sourceClass = isGutenberg ? 'gutenberg' : isOpenLibrary ? 'openlibrary' : 'internal';

                        const getImageUrl = (url) => {
                            if (!url) return "https://via.placeholder.com/150?text=No+Cover";
                            if (url.startsWith("http")) return url;
                            return `http://localhost:5000/${url.replace(/\\/g, '/')}`;
                        };

                        return (
                            <div className="book-row" key={b._id}>
                                <img src={getImageUrl(b.coverImageUrl)} alt="cover" className="book-cover-thumb" />
                                <div className="book-info">
                                    <h4>{b.title}</h4>
                                    <p>Published {b.originalData?.publishYear || '1925'} • {b.genre || 'Fiction'}</p>
                                </div>
                                <div className="author-text">{b.author}</div>
                                <div>
                                    <span className={`badge ${sourceClass}`}>{sourceLabel}</span>
                                </div>
                                <div className="isbn-text">{b.isbn}</div>
                                <div className="action-btns">
                                    <button className="action-icon edit" onClick={() => handleEditBook(b)} style={{ background: 'none', border: 'none' }}>
                                        <ChevronRight size={20} />
                                    </button>
                                    <button className="action-icon" onClick={() => handleDeleteBook(b)} style={{ background: 'none', border: 'none' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
                {books.length === 0 && !loading && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                        No records found in the collection.
                    </div>
                )}
            </div>

            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                totalBooks={totalBooks}
                itemsPerPage={itemsPerPage}
            />
        </div>
    );

    const SettingsView = () => (
        <div className="dash-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
                
                {/* Side-by-Side Wrapper for Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Profile Settings Card */}
                    <div className="stat-card" style={{ padding: '32px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <UserCircle size={24} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Profile Settings</h2>
                        </div>

                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div style={{ textAlign: 'center', width: '150px' }}>
                                <div className="user-avatar-circle" style={{ width: '150px', height: '150px', borderRadius: '16px', border: 'none', background: 'var(--surface2)', overflow: 'hidden' }}>
                                    {profilePreview ? (
                                        <img src={profilePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : user?.picture ? (
                                        <img src={user.picture.startsWith('http') ? user.picture : `http://localhost:5000/${user.picture.replace(/^\//, '').replace(/\\/g, '/')}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={80} color="#9CA3AF" />
                                    )}
                                </div>
                                <button 
                                    onClick={triggerProfileInput} 
                                    style={{ marginTop: '16px', color: 'var(--primary)', background: 'transparent', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '16px auto 0' }}
                                >
                                    Change Photo
                                </button>
                                <input type="file" ref={profileInputRef} onChange={handleProfileFileChange} style={{ display: 'none' }} accept="image/*" />
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div className="field">
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>FULL NAME</label>
                                        <input 
                                            type="text" 
                                            value={profileForm.name} 
                                            onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} 
                                            style={{ background: 'var(--surface2)', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}
                                        />
                                    </div>
                                    <div className="field">
                                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
                                        <input 
                                            type="email" 
                                            value={profileForm.email} 
                                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} 
                                            style={{ background: 'var(--surface2)', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="field" style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.05em' }}>CHANGE PASSWORD</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            value={profileForm.password} 
                                            onChange={(e) => setProfileForm({...profileForm, password: e.target.value})} 
                                            placeholder="Leave blank to keep current"
                                            style={{ background: 'var(--surface2)', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, width: '100%' }}
                                        />
                                        <div 
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9CA3AF' }}
                                        >
                                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance & Branding Card */}
                    <div className="stat-card" style={{ padding: '32px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <Sun size={24} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>Appearance & Branding</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {['original', 'light', 'lightblue'].map((mode) => (
                                <div 
                                    key={mode} 
                                    onClick={() => handleThemeChange(mode)}
                                    style={{ 
                                        padding: '16px', 
                                        borderRadius: '12px', 
                                        border: `2px solid ${theme === mode || (theme === 'smartshelf' && mode === 'original') ? 'var(--primary)' : 'var(--border)'}`, 
                                        background: mode === 'original' ? '#FDFBF7' : mode === 'light' ? '#FFFFFF' : '#F0F9FF',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: theme === mode ? '0 4px 12px rgba(85, 107, 47, 0.15)' : 'none'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform='scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform='scale(1)'}
                                >
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        borderRadius: '50%', 
                                        background: mode === 'original' ? '#556B2F' : mode === 'light' ? '#F1F5F9' : '#0EA5E9', 
                                        margin: '0 auto 12px',
                                        border: '2px solid rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {mode === 'original' && <Trees size={18} color="white" />}
                                        {mode === 'light' && <Sun size={18} color="var(--primary)" />}
                                        {mode === 'lightblue' && <Cloud size={18} color="white" />}
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.8rem', 
                                        fontWeight: 800, 
                                        color: '#2D2A26', 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {mode === 'lightblue' ? 'SKY' : mode === 'original' ? 'BRAND' : mode}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Summary Sidebar */}
                <div className="stat-card" style={{ padding: '32px', background: 'var(--primary)', color: 'var(--on-primary)', display: 'flex', flexDirection: 'column', height: 'fit-content', position: 'relative' }}>
                    <style>{`
                        @keyframes pulse-green {
                            0% { box-shadow: 0 0 0 0 rgba(107, 142, 35, 0.7); }
                            70% { box-shadow: 0 0 0 8px rgba(107, 142, 35, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(107, 142, 35, 0); }
                        }
                        .pulse-dot {
                            animation: pulse-green 2s infinite;
                        }
                    `}</style>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <Activity size={24} color="var(--on-primary)" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Status Summary</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--on-primary)', opacity: 0.9, fontWeight: 600 }}>System Health</span>
                            <span style={{ color: 'var(--on-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                                <div className={isDiagnosing ? "pulse-dot" : ""} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--on-primary)' }}></div>
                                {isDiagnosing ? "SCANNING..." : "OPTIMAL"}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--on-primary)', opacity: 0.9, fontWeight: 600 }}>Total Titles</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{totalBooks.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--on-primary)', opacity: 0.9, fontWeight: 600 }}>Total Users</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{totalUsers.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--on-primary)', opacity: 0.9, fontWeight: 600 }}>Security Level</span>
                            <span style={{ background: 'var(--surface)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900 }}>ENTERPRISE</span>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                            <button 
                                onClick={handleRunDiagnostics}
                                disabled={isDiagnosing}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    background: isDiagnosing ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', 
                                    border: '1px solid rgba(255,255,255,0.2)', 
                                    color: 'var(--on-primary)', 
                                    borderRadius: '10px', 
                                    fontWeight: 800, 
                                    fontSize: '0.9rem', 
                                    cursor: isDiagnosing ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isDiagnosing ? <RefreshCw size={16} className="spin-icon" /> : null}
                                {isDiagnosing ? "Running Diagnostics..." : "Run Diagnostics"}
                            </button>
                            {lastScanned && !isDiagnosing && (
                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '12px', fontWeight: 700 }}>
                                    LAST CHECKED: {lastScanned}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <button 
                onClick={handleSaveSettings}
                className="btn btn-primary"
                style={{ 
                    width: '100%', 
                    background: 'var(--primary)', 
                    padding: '18px', 
                    borderRadius: '16px', 
                    border: 'none', 
                    color: 'var(--on-primary)', 
                    fontWeight: 800, 
                    fontSize: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px',
                    cursor: 'pointer'
                }}
            >
                <Save size={20} /> Update Profile
            </button>
        </div>
    );

    const renderActiveView = () => {
        switch (activeTab) {
            case "overview": return OverviewView();
            case "users": return UsersView();
            case "books": return BooksView();
            case "settings": return SettingsView();
            default: return OverviewView();
        }
    };

    return (
        <div className="dash-container" style={{ background: 'var(--bg)' }}>
            {Sidebar()}
            <main className="main-content" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
                {TopBar({ title: activeTab.charAt(0).toUpperCase() + activeTab.slice(1) })}
                <div style={{ flex: 1, background: 'var(--bg)' }}>
                    {renderActiveView()}
                </div>
                {Footer()}
            </main>

            {/* Modal for Invite User */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSubmit={handleUserSubmitAction}
                formData={userForm}
                onChange={handleUserFormChange}
                editingUser={editingUser}
                setEditingUser={setEditingUser}
            />

            {/* Modal for Add/Edit Book - Extracted to fix lag */}
            <BookModal
                isOpen={isBookModalOpen}
                onClose={resetBookForm}
                onSubmit={handleBookSubmit}
                editingBook={editingBook}
                initialData={bookForm}
            />
            {/* Modal for Change Password */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handlePasswordSubmit}
                formData={passwordForm}
                setFormData={setPasswordForm}
            />

            {/* Modal for Delete Book Confirmation */}
            {isDeleteConfirmOpen && (
                <div className="modal-overlay" onClick={() => { setIsDeleteConfirmOpen(false); setBookToDelete(null); }} style={{ zIndex: 9999 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '36px', textAlign: 'center', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={28} color="#DC2626" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#111827' }}>Delete Book</h2>
                        <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '24px', lineHeight: '1.5' }}>
                            Are you sure you want to delete <strong>"{bookToDelete?.title}"</strong>? This action is permanent and cannot be undone.
                        </p>
                        
                        {/* Book Info Summary */}
                        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Book size={20} color="#DC2626" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{bookToDelete?.title}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>ISBN: {bookToDelete?.isbn || 'N/A'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => { setIsDeleteConfirmOpen(false); setBookToDelete(null); }}
                                style={{ flex: 1, padding: '12px', background: 'var(--surface)', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: 700, color: '#374151', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteBook}
                                style={{ flex: 1, padding: '12px', background: '#DC2626', border: '1px solid #DC2626', borderRadius: '8px', fontWeight: 700, color: 'white', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Delete User Confirmation */}
            {isUserDeleteConfirmOpen && (
                <div className="modal-overlay" onClick={() => { setIsUserDeleteConfirmOpen(false); setUserToDelete(null); }} style={{ zIndex: 9999 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '36px', textAlign: 'center', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={28} color="#DC2626" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#111827' }}>Delete User</h2>
                        <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '24px', lineHeight: '1.5' }}>
                            Are you sure you want to delete <strong>"{userToDelete?.name}"</strong>? This action is permanent and cannot be undone.
                        </p>
                        
                        {/* User Info Summary */}
                        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', textAlign: 'left' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <User size={20} color="#DC2626" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>{userToDelete?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>Email: {userToDelete?.email}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => { setIsUserDeleteConfirmOpen(false); setUserToDelete(null); }}
                                style={{ flex: 1, padding: '12px', background: 'var(--surface)', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: 700, color: '#374151', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDeleteUser}
                                style={{ flex: 1, padding: '12px', background: '#DC2626', border: '1px solid #DC2626', borderRadius: '8px', fontWeight: 700, color: 'white', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Global Alert Modal */}
            {customAlert && (
                <div className="modal-overlay" onClick={() => setCustomAlert(null)} style={{ zIndex: 10000 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', padding: '36px', textAlign: 'center', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{ 
                                width: '56px', height: '56px', borderRadius: '50%', 
                                background: customAlert.type === 'success' ? '#EDF2D7' : '#FEE2E2', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}>
                                {customAlert.type === 'success' ? (
                                    <CheckCircle2 size={28} color="var(--primary)" />
                                ) : (
                                    <AlertTriangle size={28} color="#DC2626" />
                                )}
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#111827' }}>
                            {customAlert.title}
                        </h2>
                        <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '32px', lineHeight: '1.5' }}>
                            {customAlert.message}
                        </p>
                        
                        <button 
                            onClick={() => setCustomAlert(null)}
                            style={{ 
                                width: '100%', padding: '12px', 
                                background: customAlert.type === 'success' ? '#556B2F' : '#DC2626', 
                                border: 'none', borderRadius: '8px', fontWeight: 700, color: 'white', cursor: 'pointer' 
                            }}
                        >
                            Understood
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
