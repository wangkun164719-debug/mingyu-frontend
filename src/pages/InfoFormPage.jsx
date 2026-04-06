import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DatePickerField, TimePickerField } from "../components/BirthPickerField";
import PageIntro from "../components/PageIntro";
import PageSection from "../components/PageSection";
import IconBadge from "../components/IconBadge";
import { preferenceOptions } from "../data/site";
import { saveLatestProfile } from "../services/reportApi";

const initialForm = {
  name: "",
  gender: "男",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  preferences: []
};

function Label({ icon, children }) {
  return (
    <label className="block">
      <span className="mb-3 flex items-center gap-3 text-base font-semibold text-white">
        <IconBadge icon={icon} className="h-9 w-9 rounded-xl" />
        {children}
      </span>
    </label>
  );
}

export default function InfoFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);

  const togglePreference = (preference) => {
    setForm((current) => {
      const exists = current.preferences.includes(preference);

      return {
        ...current,
        preferences: exists
          ? current.preferences.filter((item) => item !== preference)
          : [...current.preferences, preference]
      };
    });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    saveLatestProfile(form);
    navigate("/result", { state: { profile: form } });
  };

  return (
    <div className="pb-6">
      <PageIntro title="填写您的信息" subtitle="请准确填写以下信息，我们将为您生成专属的命理解读" />

      <PageSection className="pt-12">
        <form className="panel mx-auto max-w-3xl p-6 sm:p-8 lg:p-10" onSubmit={onSubmit}>
          <div className="space-y-7">
            <div>
              <Label icon="user">姓名</Label>
              <input
                className="input-shell"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="请输入您的姓名"
              />
            </div>

            <div>
              <Label icon="user">性别</Label>
              <div className="grid grid-cols-2 gap-4">
                {["男", "女"].map((gender) => {
                  const active = form.gender === gender;
                  return (
                    <button
                      key={gender}
                      type="button"
                      className={`rounded-2xl border px-5 py-4 text-base font-semibold transition duration-200 ${
                        active
                          ? "border-gold-300/45 bg-gold-400/12 text-gold-300 shadow-[0_0_0_3px_rgba(230,195,90,0.08)]"
                          : "border-gold-500/18 bg-white/5 text-mist-200 hover:border-gold-300/35 hover:bg-white/10"
                      }`}
                      onClick={() => setForm({ ...form, gender })}
                    >
                      {gender}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label icon="calendar">出生日期</Label>
              <DatePickerField
                value={form.birthDate}
                onChange={(birthDate) => setForm({ ...form, birthDate })}
              />
            </div>

            <div>
              <Label icon="clock">出生时间</Label>
              <TimePickerField
                value={form.birthTime}
                onChange={(birthTime) => setForm({ ...form, birthTime })}
                helperText="时辰对命理解读至关重要，请尽量准确填写。"
              />
            </div>

            <div>
              <Label icon="pin">出生地点</Label>
              <input
                className="input-shell"
                value={form.birthPlace}
                onChange={(event) => setForm({ ...form, birthPlace: event.target.value })}
                placeholder="例如：北京市朝阳区"
              />
            </div>

            <div>
              <Label icon="star">测算偏好</Label>
              <div className="flex flex-wrap gap-3">
                {preferenceOptions.map((item) => {
                  const active = form.preferences.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full border px-5 py-3 text-sm font-semibold transition duration-200 ${
                        active
                          ? "border-gold-300/45 bg-gold-400/12 text-gold-300"
                          : "border-gold-500/18 bg-white/5 text-mist-200 hover:border-gold-300/35 hover:bg-white/10"
                      }`}
                      onClick={() => togglePreference(item)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-10 w-full rounded-full border border-gold-300/40 bg-gold-400 px-6 py-4 text-base font-semibold text-ink-950 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(198,157,45,0.24)] active:scale-[0.98]"
          >
            生成命理解读
          </button>

          <p className="mt-5 text-center text-sm text-mist-400">我们承诺保护您的隐私安全</p>
        </form>
      </PageSection>

      <PageSection className="pt-8 pb-12">
        <div className="panel mx-auto max-w-3xl px-6 py-5 text-sm leading-7 text-mist-300 sm:px-8">
          <span className="font-semibold text-gold-300">温馨提示：</span>
          出生时间越准确，命理解读越精准。如不确定具体时辰，可以咨询长辈或查询出生证明。
        </div>
      </PageSection>
    </div>
  );
}
