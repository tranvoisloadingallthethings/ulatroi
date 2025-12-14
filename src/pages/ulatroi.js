import React, { useState, useMemo } from "react";
import {
  Clock,
  Feather,
  Droplet,
  Calculator,
  X,
  Plus,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function ULaTroi() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const [hours, setHours] = useState([]);

  // Tiền cầu: giá 1 quả + số lượng
  const [shuttlePricePerUnit, setShuttlePricePerUnit] = useState(""); // giá 1 quả
  const [shuttleQuantity, setShuttleQuantity] = useState(""); // số lượng quả

  const [waterCost, setWaterCost] = useState("");

  const [courtPayers, setCourtPayers] = useState([{ playerId: "", amount: "" }]);
  const [shuttlePayers, setShuttlePayers] = useState([{ playerId: "", amount: "" }]);
  const [waterPayers, setWaterPayers] = useState([{ playerId: "", amount: "" }]);

  // Helper format tiền Việt Nam
  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return "";
    const num = Math.round(parseFloat(amount) || 0);
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const parseFormattedMoney = (str) => {
    if (!str) return "";
    return str.replace(/\./g, "");
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
      if (players.length === 0) {
        setCurrentUserId(newPlayer.id);
      }
    }
  };

  const removePlayer = (id) => {
    setPlayers(players.filter((p) => p.id !== id));
    if (currentUserId === id) {
      setCurrentUserId(players.length > 1 ? players.find((p) => p.id !== id)?.id : null);
    }
  };

  const addHour = () => {
    setHours([...hours, { id: Date.now().toString(), cost: "", participants: [] }]);
  };

  const removeHour = (id) => {
    setHours(hours.filter((h) => h.id !== id));
  };

  const updateHourCost = (id, formattedValue) => {
    setHours(hours.map((h) => (h.id === id ? { ...h, cost: formattedValue } : h)));
  };

  const toggleParticipant = (hourId, playerId) => {
    setHours(
      hours.map((h) => {
        if (h.id === hourId) {
          const participants = h.participants.includes(playerId)
            ? h.participants.filter((p) => p !== playerId)
            : [...h.participants, playerId];
          return { ...h, participants };
        }
        return h;
      })
    );
  };

  const addPayer = (type) => {
    const newPayer = { playerId: "", amount: "" };
    if (type === "court") setCourtPayers([...courtPayers, newPayer]);
    else if (type === "shuttle") setShuttlePayers([...shuttlePayers, newPayer]);
    else if (type === "water") setWaterPayers([...waterPayers, newPayer]);
  };

  const updatePayer = (type, index, field, value) => {
    const updateList = (list) =>
      list.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    if (type === "court") setCourtPayers(updateList(courtPayers));
    else if (type === "shuttle") setShuttlePayers(updateList(shuttlePayers));
    else if (type === "water") setWaterPayers(updateList(waterPayers));
  };

  const removePayer = (type, index) => {
    if (type === "court") setCourtPayers(courtPayers.filter((_, i) => i !== index));
    else if (type === "shuttle") setShuttlePayers(shuttlePayers.filter((_, i) => i !== index));
    else if (type === "water") setWaterPayers(waterPayers.filter((_, i) => i !== index));
  };

  // Tổng tiền cầu = giá 1 quả × số lượng
  const shuttleTotalCost = useMemo(() => {
    const price = parseFloat(parseFormattedMoney(shuttlePricePerUnit)) || 0;
    const qty = parseFloat(parseFormattedMoney(shuttleQuantity)) || 0;
    return price * qty;
  }, [shuttlePricePerUnit, shuttleQuantity]);

  // Tổng chi phí buổi đánh
  const totalSessionCost = useMemo(() => {
    const courtTotal = hours.reduce(
      (sum, h) => sum + (parseFloat(parseFormattedMoney(h.cost)) || 0),
      0
    );
    const waterTotal = parseFloat(parseFormattedMoney(waterCost)) || 0;
    return {
      court: courtTotal,
      shuttle: shuttleTotalCost,
      water: waterTotal,
      total: courtTotal + shuttleTotalCost + waterTotal,
    };
  }, [hours, shuttleTotalCost, waterCost]);

  // Tổng tiền đã trả trước theo từng loại
  const paidTotals = useMemo(() => {
    const courtPaid = courtPayers.reduce(
      (sum, p) => sum + (parseFloat(parseFormattedMoney(p.amount)) || 0),
      0
    );
    const shuttlePaid = shuttlePayers.reduce(
      (sum, p) => sum + (parseFloat(parseFormattedMoney(p.amount)) || 0),
      0
    );
    const waterPaid = waterPayers.reduce(
      (sum, p) => sum + (parseFloat(parseFormattedMoney(p.amount)) || 0),
      0
    );

    return {
      court: courtPaid,
      shuttle: shuttlePaid,
      water: waterPaid,
    };
  }, [courtPayers, shuttlePayers, waterPayers]);

  // Kiểm tra sai lệch (cho phép sai số nhỏ ≤ 500đ)
  const mismatches = useMemo(() => {
    const tolerance = 500;
    return {
      court:
        Math.abs(paidTotals.court - totalSessionCost.court) > tolerance
          ? paidTotals.court - totalSessionCost.court
          : 0,
      shuttle:
        Math.abs(paidTotals.shuttle - shuttleTotalCost) > tolerance
          ? paidTotals.shuttle - shuttleTotalCost
          : 0,
      water:
        Math.abs(paidTotals.water - totalSessionCost.water) > tolerance
          ? paidTotals.water - totalSessionCost.water
          : 0,
    };
  }, [paidTotals, totalSessionCost, shuttleTotalCost]);

  const hasMismatch = mismatches.court !== 0 || mismatches.shuttle !== 0 || mismatches.water !== 0;

  // Tính toán chi tiết từng người
  const results = useMemo(() => {
    if (players.length === 0) return [];

    const costs = {};
    players.forEach((player) => {
      costs[player.id] = { court: 0, shuttle: 0, water: 0, paid: 0 };
    });

    // Tiền sân theo giờ tham gia
    hours.forEach((hour) => {
      const cost = parseFloat(parseFormattedMoney(hour.cost)) || 0;
      if (hour.participants.length > 0) {
        const costPerPerson = cost / hour.participants.length;
        hour.participants.forEach((playerId) => {
          if (costs[playerId]) costs[playerId].court += costPerPerson;
        });
      }
    });

    // Tiền cầu & nước chia đều
    const shuttlePerPerson = players.length > 0 ? shuttleTotalCost / players.length : 0;
    const waterPerPerson = players.length > 0 ? totalSessionCost.water / players.length : 0;
    players.forEach((player) => {
      costs[player.id].shuttle = shuttlePerPerson;
      costs[player.id].water = waterPerPerson;
    });

    // Tiền đã trả trước
    [...courtPayers, ...shuttlePayers, ...waterPayers].forEach((payer) => {
      const amount = parseFloat(parseFormattedMoney(payer.amount)) || 0;
      if (payer.playerId && costs[payer.playerId]) {
        costs[payer.playerId].paid += amount;
      }
    });

    return players.map((player) => {
      const data = costs[player.id];
      const totalCost = data.court + data.shuttle + data.water;
      const balance = totalCost - data.paid;
      return {
        id: player.id,
        name: player.name,
        courtCost: data.court,
        shuttleCost: data.shuttle,
        waterCost: data.water,
        totalCost,
        paid: data.paid,
        balance,
      };
    });
  }, [players, hours, shuttleTotalCost, waterCost, courtPayers, shuttlePayers, waterPayers]);

  // Gợi ý chuyển khoản tối ưu
  const paymentSuggestions = useMemo(() => {
    const suggestions = [];
    const balances = results.map((r) => ({ id: r.id, name: r.name, balance: r.balance }));

    const needsToPay = balances.filter((b) => b.balance > 0.5).sort((a, b) => b.balance - a.balance);
    const getsBack = balances.filter((b) => b.balance < -0.5).sort((a, b) => a.balance - b.balance);

    let i = 0, j = 0;
    while (i < needsToPay.length && j < getsBack.length) {
      let payer = needsToPay[i];
      let receiver = getsBack[j];
      const amount = Math.min(payer.balance, Math.abs(receiver.balance));

      suggestions.push({ from: payer.name, to: receiver.name, amount });

      payer.balance -= amount;
      receiver.balance += amount;

      if (payer.balance < 0.5) i++;
      if (Math.abs(receiver.balance) < 0.5) j++;
    }

    return suggestions;
  }, [results]);

  const displayMoney = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(amount));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Feather className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Tính Tiền Siêu Hay
          </h1>
          <p className="text-gray-600">Chính xác - Công bằng - Nhanh chóng</p>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 space-y-8">
          {/* Người chơi */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Người chơi</h2>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Tên người chơi"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
              />
              <button
                onClick={addPlayer}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Thêm
              </button>
            </div>

            {players.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${
                      currentUserId === player.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentUserId(player.id)}
                        className={`w-5 h-5 rounded-full border-2 transition ${
                          currentUserId === player.id
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {currentUserId === player.id && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </button>
                      <span className="font-medium text-gray-800">{player.name}</span>
                      {currentUserId === player.id && (
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Bạn</span>
                      )}
                    </div>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tiền sân */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-800">Tiền sân</h3>
              </div>
              <button
                onClick={addHour}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition font-medium text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Thêm giờ
              </button>
            </div>

            {hours.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có giờ chơi nào.</p>
            ) : (
              <div className="space-y-4">
                {hours.map((hour, idx) => (
                  <div key={hour.id} className="bg-white rounded-xl p-4 border">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold">Giờ {idx + 1}</span>
                      {hours.length > 1 && (
                        <button onClick={() => removeHour(hour.id)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={hour.cost}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\./g, "");
                        if (/^\d*$/.test(raw)) {
                          updateHourCost(hour.id, formatMoney(raw));
                        }
                      }}
                      placeholder="Giá giờ này (VNĐ)"
                      className="w-full px-4 py-2 border rounded-lg text-right font-medium mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      {players.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => toggleParticipant(hour.id, player.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            hour.participants.includes(player.id)
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 border text-gray-700"
                          }`}
                        >
                          {player.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tiền cầu */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Feather className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-800">Tiền cầu</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá 1 quả cầu</label>
                <input
                  type="text"
                  value={shuttlePricePerUnit}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, "");
                    if (/^\d*$/.test(raw)) {
                      setShuttlePricePerUnit(formatMoney(raw));
                    }
                  }}
                  placeholder="VD: 5000"
                  className="w-full px-4 py-2 border rounded-lg text-right font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng quả</label>
                <input
                  type="text"
                  value={shuttleQuantity}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, "");
                    if (/^\d*$/.test(raw)) {
                      setShuttleQuantity(formatMoney(raw));
                    }
                  }}
                  placeholder="VD: 20"
                  className="w-full px-4 py-2 border rounded-lg text-right font-medium"
                />
              </div>

              <div className="flex items-end">
                <div className="w-full bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-indigo-600 font-medium">Tổng tiền cầu</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {displayMoney(shuttleTotalCost)} ₫
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">Tổng tiền cầu sẽ được chia đều cho tất cả người chơi</p>
          </div>

          {/* Tiền nước */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Droplet className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-800">Tiền nước / đồ uống</h3>
            </div>
            <input
              type="text"
              value={waterCost}
              onChange={(e) => {
                const raw = e.target.value.replace(/\./g, "");
                if (/^\d*$/.test(raw)) {
                  setWaterCost(formatMoney(raw));
                }
              }}
              placeholder="Tổng tiền nước (VNĐ)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 text-right font-medium"
            />
            <p className="text-sm text-gray-500 mt-2">Chia đều cho tất cả người chơi</p>
          </div>

          {/* Ai đã trả tiền trước? */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ai đã trả tiền trước?</h2>

            {/* Cảnh báo nếu tổng tiền không khớp */}
            {hasMismatch && (
              <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-2">Cảnh báo: Tiền trả trước chưa khớp với chi phí thực tế!</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {mismatches.court !== 0 && (
                      <li>
                        Tiền sân: đã nhập {displayMoney(paidTotals.court)} ₫ →{" "}
                        <span className="font-bold text-red-700">
                          {mismatches.court > 0 ? "thừa" : "thiếu"} {displayMoney(Math.abs(mismatches.court))} ₫
                        </span>
                      </li>
                    )}
                    {mismatches.shuttle !== 0 && (
                      <li>
                        Tiền cầu: đã nhập {displayMoney(paidTotals.shuttle)} ₫ →{" "}
                        <span className="font-bold text-red-700">
                          {mismatches.shuttle > 0 ? "thừa" : "thiếu"} {displayMoney(Math.abs(mismatches.shuttle))} ₫
                        </span>
                      </li>
                    )}
                    {mismatches.water !== 0 && (
                      <li>
                        Tiền nước: đã nhập {displayMoney(paidTotals.water)} ₫ →{" "}
                        <span className="font-bold text-red-700">
                          {mismatches.water > 0 ? "thừa" : "thiếu"} {displayMoney(Math.abs(mismatches.water))} ₫
                        </span>
                      </li>
                    )}
                  </ul>
                  <p className="mt-3 text-xs">Vui lòng kiểm tra lại để kết quả chính xác hơn nhé!</p>
                </div>
              </div>
            )}

            {[
              { title: "Tiền sân", icon: <Clock className="w-5 h-5 text-indigo-600" />, payers: courtPayers, type: "court", actual: totalSessionCost.court },
              { title: "Tiền cầu", icon: <Feather className="w-5 h-5 text-indigo-600" />, payers: shuttlePayers, type: "shuttle", actual: shuttleTotalCost },
              { title: "Tiền nước", icon: <Droplet className="w-5 h-5 text-indigo-600" />, payers: waterPayers, type: "water", actual: totalSessionCost.water },
            ].map((section) => (
              <div key={section.type} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    Chi phí thực tế: <span className="font-bold text-indigo-600">{displayMoney(section.actual)} ₫</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    Đã nhập trả trước: <span className="font-semibold">{displayMoney(paidTotals[section.type])} ₫</span>
                  </span>
                  <button
                    onClick={() => addPayer(section.type)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm người trả
                  </button>
                </div>

                <div className="space-y-3">
                  {section.payers.map((payer, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <select
                        value={payer.playerId}
                        onChange={(e) => updatePayer(section.type, idx, "playerId", e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg"
                      >
                        <option value="">Chọn người</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={payer.amount}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\./g, "");
                          if (/^\d*$/.test(raw)) {
                            updatePayer(section.type, idx, "amount", formatMoney(raw));
                          }
                        }}
                        placeholder="Số tiền đã trả"
                        className="flex-1 px-3 py-2 border rounded-lg text-right font-medium"
                      />
                      {section.payers.length > 1 && (
                        <button
                          onClick={() => removePayer(section.type, idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Kết quả */}
          <div className="space-y-6">
            {hasMismatch && (
              <div className="p-4 bg-orange-50 border border-orange-300 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <p className="text-orange-800 font-medium">
                  Kết quả có thể chưa chính xác do tiền trả trước chưa khớp với chi phí thực tế.
                </p>
              </div>
            )}

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8" />
                <h3 className="text-2xl font-bold">Tổng chi phí buổi đánh</h3>
              </div>
              <div className="space-y-4 text-lg">
                <div className="flex justify-between">
                  <span className="text-indigo-100">Tiền sân:</span>
                  <span className="font-bold">{displayMoney(totalSessionCost.court)} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-100">Tiền cầu ({shuttleQuantity || "0"} quả):</span>
                  <span className="font-bold">{displayMoney(totalSessionCost.shuttle)} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-100">Tiền nước:</span>
                  <span className="font-bold">{displayMoney(totalSessionCost.water)} ₫</span>
                </div>
                <div className="pt-6 border-t-2 border-indigo-300 mt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">TỔNG CỘNG</span>
                    <span className="text-4xl font-bold">{displayMoney(totalSessionCost.total)} ₫</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow border overflow-hidden">
              <div className="p-6 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-800">Chi tiết từng người</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Người</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Phải trả</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Đã trả</th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr
                        key={result.id}
                        className={`border-b ${result.id === currentUserId ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{result.name}</span>
                            {result.id === currentUserId && (
                              <span className="text-xs px-3 py-1 bg-indigo-200 text-indigo-700 rounded-full font-bold">Bạn</span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6 text-right font-semibold">
                          {displayMoney(result.totalCost)} ₫
                        </td>
                        <td className="py-5 px-6 text-right text-blue-600 font-medium">
                          {displayMoney(result.paid)} ₫
                        </td>
                        <td className="py-5 px-6 text-right">
                          {result.balance > 0.5 ? (
                            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold">
                              Trả thêm {displayMoney(result.balance)} ₫
                            </span>
                          ) : result.balance < -0.5 ? (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold">
                              Nhận lại {displayMoney(Math.abs(result.balance))} ₫
                            </span>
                          ) : (
                            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full">
                              Cân bằng
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {paymentSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-indigo-600" />
                  Gợi ý chuyển khoản tối ưu
                </h3>
                <div className="space-y-4">
                  {paymentSuggestions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white rounded-xl shadow">
                      <div className="flex items-center gap-4 text-lg">
                        <span className="font-bold text-gray-800">{s.from}</span>
                        <ArrowRight className="w-6 h-6 text-indigo-500" />
                        <span className="font-bold text-gray-800">{s.to}</span>
                      </div>
                      <span className="text-2xl font-bold text-indigo-600">
                        {displayMoney(s.amount)} ₫
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
