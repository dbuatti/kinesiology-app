//
//  SelfWorkPrototype.swift
//  Native scaffold for the Self Work toolkit.
//
//  This is a drop-in SwiftUI prototype that mirrors the web PWA's structure.
//  It uses system materials, SF Pro, spring animations, and a real
//  UINavigationController-style edge swipe — the things a browser cannot give
//  you without a rewrite.
//
//  To run: create a new iOS App project in Xcode, replace ContentView.swift
//  with this file, and set the app entry point to SelfWorkApp.
//

import SwiftUI

// MARK: - Data

enum Screen: Hashable {
    case home
    case integration
    case breath
    case beliefs
    case history
    case reference
}

struct SessionLog: Identifiable {
    let id = UUID()
    let timestamp: Date
    let emotion: String
    let organ: String
    let eyePos: String
}

// MARK: - App entry point

@main
struct SelfWorkApp: App {
    var body: some Scene {
        WindowGroup {
            SelfWorkContainer()
                .preferredColorScheme(.dark)
        }
    }
}

// MARK: - Container

struct SelfWorkContainer: View {
    @State private var path = NavigationPath()
    @State private var history: [SessionLog] = []
    @State private var selectedRefTab = RefTab.esr

    var body: some View {
        NavigationStack(path: $path) {
            HomeView(
                history: history,
                onStartIntegration: { path.append(Screen.integration) },
                onBreath: { path.append(Screen.breath) },
                onBeliefs: { path.append(Screen.beliefs) },
                onHistory: { path.append(Screen.history) },
                onReference: { tab in
                    selectedRefTab = tab
                    path.append(Screen.reference)
                }
            )
            .navigationDestination(for: Screen.self) { screen in
                switch screen {
                case .home:
                    EmptyView()
                case .integration:
                    IntegrationView(onSave: addLog, onDone: { path.removeLast(path.count) })
                case .breath:
                    BreathView(onSave: addLog, onDone: { path.removeLast(path.count) })
                case .beliefs:
                    BeliefsView(onComplete: addLog, onDone: { path.removeLast(path.count) })
                case .history:
                    HistoryView(history: history)
                case .reference:
                    ReferenceView(selectedTab: $selectedRefTab)
                }
            }
        }
        .tint(.mint)
    }

    private func addLog(emotion: String, organ: String, eyePos: String) {
        history.insert(
            SessionLog(timestamp: Date(), emotion: emotion, organ: organ, eyePos: eyePos),
            at: 0
        )
        path.removeLast(path.count)
    }
}

// MARK: - Home

struct HomeView: View {
    let history: [SessionLog]
    let onStartIntegration: () -> Void
    let onBreath: () -> Void
    let onBeliefs: () -> Void
    let onHistory: () -> Void
    let onReference: (RefTab) -> Void

    var weekCount: Int {
        history.filter { Date().timeIntervalSince($0.timestamp) < 7 * 24 * 60 * 60 }.count
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                header
                primaryButton
                toolGrid
                refShortcuts
                secondaryRow
                Spacer(minLength: 120)
            }
            .padding(.horizontal, 16)
            .padding(.top, max(16, UIApplication.shared.windows.first?.safeAreaInsets.top ?? 16))
        }
        .background(Color(hex: 0x0A1411).ignoresSafeArea())
        .overlay(alignment: .bottom) { Dock() }
    }

    private var header: some View {
        VStack(spacing: 4) {
            Text("Self Work")
                .font(.system(size: 28, weight: .bold, design: .default))
                .foregroundStyle(.mint)
            Text("Emotional Integration Toolkit")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.mint.opacity(0.7))
                .tracking(2)
            if !history.isEmpty {
                Text("\(history.count) session\(history.count == 1 ? "" : "s") · \(weekCount) this week · last \(history[0].timestamp.relativeDay())")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.45))
                    .padding(.top, 4)
            }
        }
        .padding(.vertical, 8)
    }

    private var primaryButton: some View {
        Button(action: onStartIntegration) {
            HStack(spacing: 10) {
                Image(systemName: "heart.fill")
                Text("Start Emotional Integration")
            }
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(Color(hex: 0x07120D))
            .frame(maxWidth: .infinity, minHeight: 56)
            .background(.mint)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var toolGrid: some View {
        HStack(spacing: 12) {
            ToolCard(icon: "wind", title: "Breath Recovery", subtitle: "~5–10 min · BOLT", action: onBreath)
            ToolCard(icon: "brain", title: "Limiting Beliefs", subtitle: "Shift the story", action: onBeliefs)
        }
    }

    private var refShortcuts: some View {
        HStack(spacing: 8) {
            ForEach([RefTab.esr, .organs, .eyes]) { tab in
                Button { onReference(tab) } label: {
                    Text(tab.label)
                        .font(.system(size: 11, weight: .semibold))
                        .tracking(1)
                        .foregroundStyle(.white.opacity(0.6))
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .background(.white.opacity(0.05))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.06)))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var secondaryRow: some View {
        HStack(spacing: 8) {
            Button { onHistory() } label: {
                Label("History\(history.isEmpty ? "" : " · \(history.count)")", systemImage: "clock")
                    .font(.system(size: 14, weight: .semibold))
            }
            .buttonStyle(GhostButton())

            Button { } label: {
                Label("Export", systemImage: "square.and.arrow.down")
                    .font(.system(size: 14, weight: .semibold))
            }
            .buttonStyle(GhostButton())
        }
    }
}

struct ToolCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(.mint)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .font(.system(size: 10))
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, minHeight: 88, alignment: .leading)
            .background(.white.opacity(0.05))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(.white.opacity(0.1)))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Dock

struct Dock: View {
    var body: some View {
        HStack {
            Spacer()
            DockItem(icon: "house.fill", label: "Home", active: true)
            DockItem(icon: "clock", label: "History", active: false)
            DockItem(icon: "book", label: "Reference", active: false)
            DockItem(icon: "person", label: "Profile", active: false)
            Spacer()
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 10)
        .padding(.bottom, UIApplication.shared.windows.first?.safeAreaInsets.bottom ?? 0)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).stroke(.white.opacity(0.15)))
        )
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
    }
}

struct DockItem: View {
    let icon: String
    let label: String
    let active: Bool

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 20))
            Text(label)
                .font(.system(size: 10, weight: .medium))
        }
        .foregroundStyle(active ? .mint : .white.opacity(0.4))
        .frame(maxWidth: .infinity, minHeight: 52)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(active ? .white.opacity(0.15) : .clear)
        )
    }
}

// MARK: - Placeholder tool views

struct IntegrationView: View {
    let onSave: (String, String, String) -> Void
    let onDone: () -> Void

    var body: some View {
        VStack {
            Text("Emotional Integration")
                .font(.title.bold())
                .foregroundStyle(.mint)
            Spacer()
            Button("Save & Done") { onSave("Worry", "Stomach", "Up-left") }
                .buttonStyle(PrimaryButton())
            Button("Cancel") { onDone() }
                .buttonStyle(GhostButton())
        }
        .padding()
        .background(Color(hex: 0x0A1411).ignoresSafeArea())
        .navigationBarBackButtonHidden(true)
    }
}

struct BreathView: View {
    let onSave: (String, String, String) -> Void
    let onDone: () -> Void

    var body: some View {
        VStack {
            Text("Breath Recovery")
                .font(.title.bold())
                .foregroundStyle(.mint)
            Spacer()
            Button("Save & Done") { onSave("Breath Recovery", "BOLT 18→22", "N/A") }
                .buttonStyle(PrimaryButton())
        }
        .padding()
        .background(Color(hex: 0x0A1411).ignoresSafeArea())
        .navigationBarBackButtonHidden(true)
    }
}

struct BeliefsView: View {
    let onComplete: (String, String, String) -> Void
    let onDone: () -> Void

    var body: some View {
        VStack {
            Text("Limiting Beliefs")
                .font(.title.bold())
                .foregroundStyle(.mint)
            Spacer()
            Button("Save & Done") { onComplete("Limiting Beliefs", "Belief dissolved", "N/A") }
                .buttonStyle(PrimaryButton())
        }
        .padding()
        .background(Color(hex: 0x0A1411).ignoresSafeArea())
        .navigationBarBackButtonHidden(true)
    }
}

struct HistoryView: View {
    let history: [SessionLog]

    var body: some View {
        List(history) { log in
            VStack(alignment: .leading) {
                Text(log.emotion).font(.headline)
                Text("\(log.organ) · \(log.eyePos) · \(log.timestamp.relativeDay())")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .listRowBackground(Color.white.opacity(0.05))
        }
        .listStyle(.plain)
        .background(Color(hex: 0x0A1411).ignoresSafeArea())
        .navigationTitle("History")
    }
}

enum RefTab: String, CaseIterable, Identifiable {
    case esr, organs, eyes
    var id: String { rawValue }
    var label: String {
        switch self {
        case .esr: return "ESR"
        case .organs: return "Organs"
        case .eyes: return "Eyes"
        }
    }
}

struct ReferenceView: View {
    @Binding var selectedTab: RefTab

    var body: some View {
        VStack {
            Picker("Reference", selection: $selectedTab) {
                ForEach(RefTab.allCases) { tab in
                    Text(tab.label).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            Spacer()
            Text("\(selectedTab.label) reference content")
                .foregroundStyle(.white.opacity(0.6))
            Spacer()
        }
        .background(Color(hex: 0x0A1411).ignoresSafeArea())
        .navigationTitle("Reference")
    }
}

// MARK: - Reusable button styles

struct PrimaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(Color(hex: 0x07120D))
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(.mint)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct GhostButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.white.opacity(0.7))
            .frame(maxWidth: .infinity, minHeight: 48)
            .background(.white.opacity(0.05))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white.opacity(0.1)))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

// MARK: - Helpers

extension Color {
    init(hex: Int) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

extension Date {
    func relativeDay() -> String {
        let days = Calendar.current.dateComponents([.day], from: self, to: Date()).day ?? 0
        if days <= 0 { return "today" }
        if days == 1 { return "yesterday" }
        return "\(days)d ago"
    }
}
