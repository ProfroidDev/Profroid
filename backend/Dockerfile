# ============================
# 1 - Builder Image
#    Use Gradle image to avoid downloading the distribution during build
# ============================
FROM gradle:8.7-jdk17 AS builder

WORKDIR /workspace

# Copy Gradle wrapper files first (for dependencies and plugins)
COPY gradlew .
COPY gradlew.bat .
COPY gradle gradle

# Copy build files
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# Build using preinstalled Gradle (matches wrapper version) to avoid fetching distribution
RUN gradle clean bootJar --no-daemon

# ============================
# 2 - Runtime Image
# ============================
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=builder /workspace/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
