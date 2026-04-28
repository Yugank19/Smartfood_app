package com.myanatomy.sandboxpro.repository;

import com.myanatomy.sandboxpro.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {

    @Query("SELECT o FROM Otp o WHERE o.phone = :phone AND o.verified = false ORDER BY o.createdAt DESC")
    Optional<Otp> findTopByPhoneAndIsVerifiedFalseOrderByCreatedAtDesc(String phone);

    // Native query with LIMIT 1 to avoid NonUniqueResultException
    @Query(value = "SELECT * FROM otps WHERE phone = :phone AND otp_code = :otpCode AND is_verified = false ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<Otp> findTopByPhoneAndOtpCodeOrderByCreatedAtDesc(String phone, String otpCode);

    @Query("SELECT o FROM Otp o WHERE o.phone = :phone AND o.verified = true")
    List<Otp> findByPhoneAndIsVerifiedTrue(String phone);

    @Modifying
    @Transactional
    @Query("DELETE FROM Otp o WHERE o.phone = :phone")
    void deleteByPhone(String phone);
}
