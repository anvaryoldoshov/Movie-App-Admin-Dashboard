import React, { useState, useEffect } from "react";
import {
  getAllSeries,
  getAllUsers,
  getEpisodesBySeries,
  giveAccessMovie,
} from "../services/api";

const VideoList = () => {
  const [series, setSeries] = useState([]);
  const [episodes, setEpisodes] = useState({});
  const [paidUsers, setPaidUsers] = useState([]);
  const [openSeriesId, setOpenSeriesId] = useState(null);
  const [openEpisode, setOpenEpisode] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchSeries();
    fetchPaidUsers();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSeries = async () => {
    try {
      const res = await getAllSeries();
      setSeries(res);
    } catch (e) {
      console.error("Series fetch error:", e);
      setNotification("❌ Failed to load series");
    }
  };

  const fetchEpisodes = async (seriesId) => {
    if (episodes[seriesId]) return; // faqat bir marta yuklaymiz
    try {
      const res = await getEpisodesBySeries(seriesId);
      setEpisodes((prev) => ({ ...prev, [seriesId]: res }));
    } catch (e) {
      console.error("Episodes fetch error:", e);
      setNotification("❌ Failed to load episodes");
    }
  };

  const fetchPaidUsers = async () => {
    try {
      const res = await getAllUsers();
      const sorted = res.sort((a, b) =>
        a.username.localeCompare(b.username)
      );
      setPaidUsers(sorted);
    } catch (e) {
      console.error("Users fetch error:", e);
      setNotification("❌ Failed to load users");
    }
  };

  const handleSeriesClick = (seriesId) => {
    setOpenSeriesId((prev) => (prev === seriesId ? null : seriesId));
    if (!episodes[seriesId]) fetchEpisodes(seriesId);
  };

  const handleEpisodeClick = (episode) => {
    setOpenEpisode(episode);
    setSelectedUsers([]);
    setSearch("");
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSaveUsers = async () => {
    if (!openEpisode) return;
    try {
      for (let userId of selectedUsers) {
        await giveAccessMovie(userId, openEpisode.seriesId, true);
      }
      setOpenEpisode(null);
      setSelectedUsers([]);
      setNotification("✅ Users assigned successfully");
    } catch (e) {
      console.error("Assign users error:", e);
      const msg =
        e.response?.data?.message || e.message || "❌ Failed to assign users";
      setNotification(msg);
    }
  };

  const filteredUsers = paidUsers.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f111a] p-6 ml-64" >
      <h2 className="text-2xl text-white font-semibold mb-6">🎬 Video List</h2>

      {/* Notification */}
      {notification && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-black-700 border text-lg border-red-400">
          {notification}
        </div>
      )}

      {/* Series list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {series.map((s) => (
          <div
            key={s.id}
            className="border rounded-xl bg-white shadow hover:shadow-lg transition"
          >
            {/* Series header */}
            <div
              className="w-full text-left px-4 py-3 font-medium bg-gray-100 hover:bg-gray-200 rounded-t-xl cursor-pointer"
              onClick={() => handleSeriesClick(s.id)}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{s.title}</span>
                <span className="text-sm text-gray-500">
                  {openSeriesId === s.id ? "▾" : "▸"}
                </span>
              </div>
            </div>

            {/* Episodes */}
            {openSeriesId === s.id && (
              <div className="px-4 py-3 space-y-2 border-t">
                {episodes[s.id]?.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <span>{ep.title}</span>
                    <button
                      onClick={() => handleEpisodeClick(ep)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                    >
                      Manage Users
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {openEpisode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              Assign Users to{" "}
              <span className="text-blue-600">{openEpisode.title}</span>
            </h3>

            {/* Search */}
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg mb-3"
            />

            {/* Users */}
            <div className="max-h-64 overflow-y-auto space-y-2 border p-3 rounded-lg">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <label key={user.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>{user.username}</span>
                  </label>
                ))
              ) : (
                <p className="text-gray-500">No users found</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setOpenEpisode(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                ⬅ Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenEpisode(null)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUsers}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;