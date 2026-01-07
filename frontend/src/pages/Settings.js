import React, { useState } from "react";
import Navbar from "../components/Navbar";
import {
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Eye,
  Save,
  Key,
  Mail,
  Phone,
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    // Profile
    fullName: "Roshantha Fernando",
    email: "Roshanthafernando@inseecement.lk",
    phone: "+94 77 123 4567",
    department: "Quality Control",
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    reportAlerts: true,
    // Appearance
    darkMode: false,
    language: "English",
    // Security
    twoFactorAuth: false,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    alert("Settings saved successfully!");
    console.log("Saved settings:", formData);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Eye },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="flex gap-6">
            {/* Sidebar Tabs */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-red-50 text-red-600 font-semibold shadow-sm"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Profile Information
                      </h2>
                      <p className="text-gray-600">
                        Update your personal information and contact details
                      </p>
                    </div>

                    {/* Profile Picture */}
                    <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        JD
                      </div>
                      <div>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                          Change Photo
                        </button>
                        <p className="text-sm text-gray-500 mt-2">
                          JPG, PNG or GIF. Max size 2MB
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <User size={16} className="inline mr-2" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) =>
                            handleInputChange("fullName", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Mail size={16} className="inline mr-2" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Phone size={16} className="inline mr-2" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Department
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) =>
                            handleInputChange("department", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        >
                          <option>Quality Control</option>
                          <option>Production</option>
                          <option>Research & Development</option>
                          <option>Engineering</option>
                          <option>Management</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Notification Preferences
                      </h2>
                      <p className="text-gray-600">
                        Choose how you want to receive notifications
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="text-red-600" size={20} />
                          <div>
                            <p className="font-semibold text-gray-900">
                              Email Notifications
                            </p>
                            <p className="text-sm text-gray-600">
                              Receive updates via email
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.emailNotifications}
                            onChange={(e) =>
                              handleInputChange(
                                "emailNotifications",
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="text-red-600" size={20} />
                          <div>
                            <p className="font-semibold text-gray-900">
                              Push Notifications
                            </p>
                            <p className="text-sm text-gray-600">
                              Receive browser notifications
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.pushNotifications}
                            onChange={(e) =>
                              handleInputChange(
                                "pushNotifications",
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="text-red-600" size={20} />
                          <div>
                            <p className="font-semibold text-gray-900">
                              Report Alerts
                            </p>
                            <p className="text-sm text-gray-600">
                              Get notified when new reports are available
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.reportAlerts}
                            onChange={(e) =>
                              handleInputChange(
                                "reportAlerts",
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Security Settings
                      </h2>
                      <p className="text-gray-600">
                        Manage your account security and password
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3 mb-3">
                          <Key className="text-red-600" size={24} />
                          <h3 className="font-semibold text-gray-900">
                            Change Password
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Update your password to keep your account secure
                        </p>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                          Change Password
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Shield className="text-red-600" size={20} />
                          <div>
                            <p className="font-semibold text-gray-900">
                              Two-Factor Authentication
                            </p>
                            <p className="text-sm text-gray-600">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.twoFactorAuth}
                            onChange={(e) =>
                              handleInputChange(
                                "twoFactorAuth",
                                e.target.checked
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Active Sessions
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                            <div>
                              <p className="font-medium text-gray-900">
                                Windows PC - Chrome
                              </p>
                              <p className="text-sm text-gray-600">
                                Current session • Colombo, Sri Lanka
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === "appearance" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Appearance Settings
                      </h2>
                      <p className="text-gray-600">
                        Customize how the application looks and feels
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Moon className="text-red-600" size={20} />
                          <div>
                            <p className="font-semibold text-gray-900">
                              Dark Mode
                            </p>
                            <p className="text-sm text-gray-600">
                              Switch to dark theme
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.darkMode}
                            onChange={(e) =>
                              handleInputChange("darkMode", e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Globe className="text-red-600" size={20} />
                          <label className="font-semibold text-gray-900">
                            Language
                          </label>
                        </div>
                        <select
                          value={formData.language}
                          onChange={(e) =>
                            handleInputChange("language", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        >
                          <option>English</option>
                          <option>Sinhala</option>
                          <option>Tamil</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-end gap-3">
                    <button className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <Save size={18} />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
